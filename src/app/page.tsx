"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/destinations").then((response) => {
      response.json().then((jsonResponse) => {
        setDestinations(jsonResponse.data);
        setFilteredDestinations(jsonResponse.data);
      });
    });
  }, []);

  const onChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(e.target.value);

    if (!term) {
      setFilteredDestinations(destinations);
      return;
    }

    const filtered = destinations.filter((destination) => {
      return (
        destination.name.toLowerCase().includes(term) ||
        destination.country.toLowerCase().includes(term) ||
        destination.region.toLowerCase().includes(term) ||
        destination.costLevel.toLowerCase().includes(term) ||
        destination.activities.some((a) => a.toLowerCase().includes(term)) ||
        String(destination.averageDailyBudget).includes(term) ||
        String(destination.annualVisitors).includes(term)
      );
    });

    setFilteredDestinations(filtered);
  };

  const onClick = () => {
    setSearchTerm("");
    setFilteredDestinations(destinations);
  };

  return (
    <main style={{ margin: "24px" }}>
      <h1>Project Expedition Destinations</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>Searching for: {searchTerm}</p>
        <input style={{ border: "1px solid black" }} onChange={onChange} value={searchTerm} />
        <button onClick={onClick}>Reset Search</button>
      </div>
      <br />
      <br />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Region</th>
            <th>Cost Level</th>
            <th>Activities</th>
            <th>Avg. Daily Budget</th>
            <th>Annual Visitors</th>
          </tr>
        </thead>
        <tbody>
          {filteredDestinations.map((destination) => (
            <tr key={destination.name}>
              <td>{destination.name}</td>
              <td>{destination.country}</td>
              <td>{destination.region}</td>
              <td>{destination.costLevel}</td>
              <td>
                {destination.activities.map((a) => (
                  <div key={a}>{a}</div>
                ))}
              </td>
              <td>{destination.averageDailyBudget}</td>
              <td>{destination.annualVisitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}