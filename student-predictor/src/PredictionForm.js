import React, { useState, useRef } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { jsPDF } from "jspdf"; // Import jsPDF for PDF generation
import html2canvas from "html2canvas"; // Import html2canvas for taking chart snapshots
import "./PredictionForm.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register components for chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PredictionForm = () => {
  const [data, setData] = useState({
    name: "",
    course: "",
    totalSemesters: "",
    presentSemester: "",
    sgpas: [],
    cgpa: "",
    hours: "",
    assignments: "",
    attendance: "",
  });
  const [result, setResult] = useState(null);
  const [advice, setAdvice] = useState("");
  const [reportVisible, setReportVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false); // State to control video visibility
  const chartRef = useRef(null); // Ref to capture chart for snapshot

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSGPAChange = (index, value) => {
    const updatedSgpas = [...data.sgpas];
    updatedSgpas[index] = value;
    setData({ ...data, sgpas: updatedSgpas });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start the loading animation

    const apiUrl = window.location.hostname === "localhost" ? "http://localhost:5000/api/predict" : "http://192.168.0.108:5000/api/predict";
    
    try {
      const res = await axios.post(apiUrl, data);
      setResult(res.data.prediction);

      const trend = calculatePerformanceTrend(data.sgpas);
      setAdvice(generateAdvice(trend));

      setReportVisible(true);
      setLoading(false); // Stop the loading animation
    } catch (err) {
      console.error("Error fetching prediction:", err.response ? err.response.data : err.message);
      setResult("Error: Unable to fetch prediction.");
      setLoading(false);
    }
  };

  const calculatePerformanceTrend = (sgpas) => {
    const trend = sgpas.reduce((acc, val, index, arr) => {
      if (index === 0) return acc;
      return acc + (val > arr[index - 1] ? 1 : val < arr[index - 1] ? -1 : 0);
    }, 0);
    return trend > 0 ? "improving" : trend < 0 ? "declining" : "steady";
  };

  const generateAdvice = (trend) => {
    if (trend === "improving") {
      return "Great job! Keep up the consistent efforts and continue improving your skills.";
    } else if (trend === "declining") {
      return "Your performance has been declining. Focus on areas of improvement, seek help if needed, and manage your time effectively.";
    } else {
      return "Your performance is steady. Aim for continuous improvement to achieve even better results.";
    }
  };

  const semesterCount = Number(data.presentSemester) > 0 ? Number(data.presentSemester) - 1 : 0;

  const performanceData = {
    labels: data.sgpas.map((_, i) => `Semester ${i + 1}`),
    datasets: [
      {
        label: "SGPA",
        data: data.sgpas,
        fill: false,
        backgroundColor: "rgba(75,192,192,1)",
        borderColor: "rgba(75,192,192,1)",
      },
      {
        label: "CGPA",
        data: Array(data.sgpas.length).fill(parseFloat(data.cgpa) || 0),
        fill: false,
        backgroundColor: "rgba(255,99,132,1)",
        borderColor: "rgba(255,99,132,1)",
      },
    ],
  };

  // Function to generate and download the report in PDF format
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);

    // Student Details
    doc.text(`Student Report for ${data.name}`, 20, 20);
    doc.text(`Course: ${data.course}`, 20, 30);
    doc.text(`Total Semesters: ${data.totalSemesters}`, 20, 40);
    doc.text(`Present Semester: ${data.presentSemester}`, 20, 50);
    doc.text(`CGPA: ${data.cgpa}`, 20, 60);
    doc.text(`Study Hours: ${data.hours}`, 20, 70);
    doc.text(`Assignments Completed: ${data.assignments}`, 20, 80);
    doc.text(`Attendance: ${data.attendance}%`, 20, 90);
    doc.text(`SGPA:`, 20, 100);

    // Adding SGPA values for previous semesters
    data.sgpas.forEach((sgpa, index) => {
      doc.text(`Semester ${index + 1}: ${sgpa}`, 20, 110 + (index * 10));
    });

    // Predicted Score
    doc.text(`Predicted Score: ${result}`, 20, 110 + (data.sgpas.length * 10) + 10);
    
    // Advice
    const adviceText = generateAdvice(calculatePerformanceTrend(data.sgpas));
    const adviceLines = doc.splitTextToSize(`Advice: ${adviceText}`, 180);  // Split text to fit within width
    let yPosition = 120 + (data.sgpas.length * 10) + 10;
    adviceLines.forEach((line, index) => {
      doc.text(line, 20, yPosition + index * 10);
    });

    // Adding Snapshot of the Chart
    const chartElement = document.querySelector(".performance-chart canvas");
    if (chartElement) {
      html2canvas(chartElement).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 20, yPosition + (adviceLines.length * 10) + 10, 180, 100);
        
        // Save the generated PDF
        doc.save(`${data.name}_Report.pdf`);
      });
    } else {
      // If the chart isn't available, save the PDF without it
      doc.save(`${data.name}_Report.pdf`);
    }
  };

  return (
    <div className="prediction-form-container">
      <h1>Welcome Buddy, Let's Analyze Your Performance</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input name="name" placeholder="Name" onChange={handleChange} />
          <input name="course" placeholder="Course Name" onChange={handleChange} />
        </div>
        <div className="form-group">
          <input name="totalSemesters" placeholder="Total Semesters" onChange={handleChange} />
          <input name="presentSemester" placeholder="Present Semester" onChange={handleChange} />
        </div>
        
        {/* SGPA Input with both range and input box */}
        <div className="sgpa-group">
          {[...Array(semesterCount)].map((_, index) => (
            <div key={index}>
              <label>SGPA Semester {index + 1}:</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={data.sgpas[index] || 0}
                onChange={(e) => handleSGPAChange(index, parseFloat(e.target.value))}
                className="range-slider"
              />
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={data.sgpas[index] || 0}
                onChange={(e) => handleSGPAChange(index, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        {/* CGPA Input with both range and input box */}
        <div className="form-group">
          <label>CGPA:</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={data.cgpa}
            onChange={handleChange}
            name="cgpa"
            className="range-slider"
          />
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={data.cgpa}
            onChange={handleChange}
            name="cgpa"
          />
        </div>

        {/* Study Hours Input with both range and input box */}
        <div className="form-group">
          <label>Hours Studied:</label>
          <input
            type="range"
            min="0"
            max="24"
            step="1"
            value={data.hours}
            onChange={handleChange}
            name="hours"
            className="range-slider"
          />
          <input
            type="number"
            min="0"
            max="24"
            value={data.hours}
            onChange={handleChange}
            name="hours"
          />
        </div>

        {/* Assignments Input with both range and input box */}
        <div className="form-group">
          <label>Assignments Completed:</label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={data.assignments}
            onChange={handleChange}
            name="assignments"
            className="range-slider"
          />
          <input
            type="number"
            min="0"
            max="10"
            value={data.assignments}
            onChange={handleChange}
            name="assignments"
          />
        </div>

        {/* Attendance Input with both range and input box */}
        <div className="form-group">
          <label>Attendance (%):</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={data.attendance}
            onChange={handleChange}
            name="attendance"
            className="range-slider"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={data.attendance}
            onChange={handleChange}
            name="attendance"
          />
        </div>

        <button type="submit">Predict</button>

      </form>
      {/* Fullscreen Video */}
      {showVideo && (
          <div className="video-overlay">
            <video
              src="C:\Users\DELL.DESKTOP-KROUCS1\Desktop\DOM PROJ\student-predictor\src\Loading.mp4" // Replace with your video file path
              autoPlay
              muted
              onEnded={() => setShowVideo(false)} // Hide video after playback
              className="fullscreen-video"
            />
          </div>
        )}
      {loading && <p>Loading...</p>}
      {result && <p>Predicted Score: {result}</p>}
      {advice && <p>Advice: {advice}</p>}
      {data.sgpas.length > 0 && (
        <div className="performance-chart" ref={chartRef}>
          <Line data={performanceData} />
        </div>
      )}

      {/* Display Report */}
      {reportVisible && (
        <div className="report-container">
          <h2>Student Report</h2>
          <p><strong>Name:</strong> {data.name}</p>
          <p><strong>Course:</strong> {data.course}</p>
          <p><strong>Total Semesters:</strong> {data.totalSemesters}</p>
          <p><strong>Study Hours:</strong> {data.hours}</p>
          <p><strong>Assignments Completed:</strong> {data.assignments}</p>
          <p><strong>Attendance:</strong> {data.attendance}%</p>
          <p><strong>CGPA:</strong> {data.cgpa}</p>
          <p><strong>SGPA for Previous Semesters:</strong></p>
          <ul>
            {data.sgpas.map((sgpa, index) => (
              <li key={index}>Semester {index + 1}: {sgpa}</li>
            ))}
          </ul>
          <p><strong>Predicted Score:</strong> {result}</p>
          <p><strong>Advice:</strong> {advice}</p>

          {/* Button to download the report */}
          <button onClick={generatePDF}>Download Report</button>
        </div>
      )}
    
    </div>
  );
};

export default PredictionForm;
