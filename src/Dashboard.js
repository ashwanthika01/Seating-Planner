import React from 'react';

function DashboardSelector({ onSelect }) {
  return (
    <div className="container text-center mt-5">
      <h1>Select Dashboard</h1>
      <button className="btn btn-primary m-3" onClick={() => onSelect('CIT')}>CIT Dashboard</button>
      <button className="btn btn-success m-3" onClick={() => onSelect('CITAR')}>CITAR Dashboard</button>
    </div>
  );
}

export default DashboardSelector;
