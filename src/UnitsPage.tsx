import React, { useEffect, useState, useMemo } from 'react';
import {Link} from 'react-router-dom';
import debounce from 'lodash.debounce';
import 'react-tooltip/dist/react-tooltip.css';
import Unit from './Unit';
import { Tooltip } from 'react-tooltip';
import { HashLink } from 'react-router-hash-link';


const UnitsPage = (props: UnitsPage) => {

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [query, setQuery] = useState<string[]>([]);
  const [isCompactMode, setIsCompactMode] = useState(true);

  const { who } = props;
  let title = "";
  let datafile = '';
  switch (who) {
    case 'ua':
      title = 'Ukrainian Units';
      datafile = 'ua.json';
      break;
    case 'ru':
      title = 'Russian Units';
      datafile = 'ru.json';
      break;  
    default:
      break;
  }

  const onQueryChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const aQuery = (e.target.value).toLocaleLowerCase();
    if (aQuery === '') {
      setQuery([]);
    } else {
      const queryWords = (e.target.value).toLocaleLowerCase().split(' ');
      setQuery(queryWords);
    }
  }
  const debouncedQueryHandler = useMemo(
    () => debounce(onQueryChangeHandler, 750)
  , []);

  const resetForm = () => {
    setQuery([]);
  }

  const onCompactMode = () => {
    setIsCompactMode(!isCompactMode);
  }

  const fetchData = () => {
    fetch(`./${datafile}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
  }

  useEffect(() => {
    fetchData();
  }, []);

  const onHamburgerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const elem = e.currentTarget;
    elem.classList.toggle('checked');
    const jumperContent = document.getElementById('jumpercontent');
    jumperContent?.classList.toggle('show')
  }
  const onHamburgerItemClick = () => {
    const hamburger = document.getElementById('hamburger');
    hamburger?.classList.toggle('checked');
    const jumperContent = document.getElementById('jumpercontent');
    jumperContent?.classList.toggle('show')
  }


  // filter data
  const queryCheck = (aString: string): boolean => {
    for (let i = 0; i < query.length; i++) {
      const pattern = new RegExp(query[i], 'g');
      if (!pattern.test(aString)) {
        return false; // one pattern not found, return false
      }
    }
    return true; // all found
  }
  const filterUnit = (unit: Unit) => {
    const { name, subunits, meta, patches } = unit;
    // first go into the most nested unit and work your way up
    let filteredSubUnits: any = [];
    if (Array.isArray(subunits)) {
      filteredSubUnits = subunits.filter((subunit) => filterUnit(subunit));
    }
    // has the unit matching subunits
    const hasMatchingSubunits = filteredSubUnits.length > 0;
    unit.subunits = filteredSubUnits;
    // check the unit itself
    let isPatternInUnitName = false;
    let isPatternInTags = false;
    let isPatternInDescription = false;
    if (name) {
      isPatternInUnitName = queryCheck(name.toLocaleLowerCase()); // name check
    }
    if (meta && meta.description !== undefined) {
      isPatternInDescription = queryCheck(meta.description.toLocaleLowerCase()); // name check
    }
    if (meta && meta.tags !== undefined) {
      console.log(meta.tags)
      isPatternInTags = queryCheck(meta.tags.toLocaleLowerCase()); // tags check
    }    
    const patternFound = isPatternInUnitName || isPatternInTags || isPatternInDescription;
    // in compact mode add an empty patch in case there was a pattern match
    // otherwise nothing would be shown
    if (isCompactMode && patternFound && !patches) {
      unit.patches = [{ full: 'images/unknown.jpg', thumb: 'images/unknown.jpg' }];
    }
    // if unit itself doesn't match, but has matching subunits
    // remove the units own features (patches, meta) and return true
    if (!patternFound && hasMatchingSubunits) {
      delete unit.patches;
      delete unit.meta;
      return true;
    }
    // If the unit itself has matches, just return true
    // otherwise return false
    return patternFound;
  }
  let filteredData = JSON.parse(JSON.stringify(data)) as Unit[]; // deep clone of the array of object
  if (query.length > 0) {
    filteredData = filteredData.filter(unit => filterUnit(unit));
  }

  // generate all unit components
  const units: any = [];

  // are we in search mode?
  const searchmode = query && query.length > 0;

  // loop through all base units
  const baseUnits: baseUnit[] = []
  filteredData.forEach((unitData: Unit, idx) => {
    const jumpKey = `cat-${idx}`;
    const unit= (
      <div key={idx} id={jumpKey} className="unit-wrapper">
        <Unit {...unitData} compact={isCompactMode} searchmode={searchmode} />
      </div>
      );
    units.push(unit);
    const baseUnit: baseUnit = {
      name: unitData.name,
      jumpKey: idx
    }
    baseUnits.push(baseUnit)
  });

  const jumperContent = baseUnits.map((bu, idx) => {
    const jumperKey = `cat-${idx}`;
    return <HashLink to={`#${jumperKey}`} className="jumper-item" onClick={onHamburgerItemClick}>{bu.name}</HashLink>;
  });

  const content = isLoading
  ? <div className="loading">Loading...</div>
  : (<div className="units">{units}</div>);

  const compactModeText = isCompactMode
    ? 'Details'
    : 'Compact';

  const resetButtonClass = searchmode ? 'show' : 'hide';

  // finally, return everything
  return (
    <div className="unitspage">
      <header>
        <Link to="/" id="homelink">[ Home ]</Link> 
        <h3 className="units-title">{title}</h3>
        <button id="compactmode" onClick={onCompactMode}>[ {compactModeText} ]</button>
      </header>
      <div id="opbox">
        <div id="filterbox">Filter Units: 
        <form>
          <input type="text" onChange={debouncedQueryHandler} placeholder="type a query"/>
          <button type="reset" className={resetButtonClass} onClick={() => resetForm()}>&times;</button>
        </form>
        </div>
        <div id="helpbox"><a href="https://twitter.com/intent/tweet?text=@UAControlMap" target="_blank">Tweet us to report any corrections/mistakes/additions</a></div>
        <div id="jumperbox">
          <div id="hamburger" onClick={onHamburgerClick}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
          <div id="jumpercontent">{jumperContent}</div>
        </div>
      </div> 
      <div className='scrollbox'>
        <div className="max-wrapper">{units}</div>   
      </div>  
      <Tooltip anchorSelect=".patch-tooltip" id="patch-tooltip"/>
    </div>
  
  );
};

export default UnitsPage;