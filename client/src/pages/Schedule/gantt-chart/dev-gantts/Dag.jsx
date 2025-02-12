import React, { useEffect, useState } from "react";
import { Graph } from "react-d3-graph";

// Example DAG data (imported from the Python backend or hardcoded for testing)
const dagData = {
  "Task A": ["Task B", "Task D"],
  "Task B": ["Task C"],
  "Task C": [],
  "Task D": [],
};

// Function to transform DAG data into `react-d3-graph` format
const transformDataForGraph = (dag) => {
  const nodes = Object.keys(dag).map((task) => ({ id: task }));
  const links = Object.entries(dag).flatMap(([task, dependencies]) =>
    dependencies.map((dep) => ({ source: task, target: dep }))
  );

  return { nodes, links };
};

const Dag = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Transform the DAG data into the required format
    const transformedData = transformDataForGraph(dagData);
    setGraphData(transformedData);
  }, []);

  // Graph configuration
  const config = {
    directed: true,
    nodeHighlightBehavior: true,
    node: {
      color: "lightblue",
      size: 300,
      highlightStrokeColor: "blue",
    },
    link: {
      highlightColor: "lightblue",
    },
  };

  return (
    <div>
      <h1>DAG Visualization</h1>
      <Graph id="dag-graph" data={graphData} config={config} />
    </div>
  );
};

export default Dag;