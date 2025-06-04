import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import "./Principal.css";
import Header from "../Header/Header";
import welcomeIcon from "../../assets/icons/empresa.png";
import phoneIcon from "../../assets/icons/llamada.png";
import meetingIcon from "../../assets/icons/reunion.png";
import emailIcon from "../../assets/icons/correo.png";

// Registra componentes de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Principal = () => {
    const navigate = useNavigate();
    const [barThickness, setBarThickness] = useState(40); 
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userRol = localStorage.getItem('userRol') || 'EMPLEADO';

    // Verifica token al cargar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    // Datos estáticos para el gráfico
    const etapas = [
        "Clasificación",
        "Primer Contacto",
        "Envío de Información",
        "Reunión",
        "Cotización Propuesta/Práctica",
        "Negociación/revisión",
        "Cerrado Ganado",
        "Respuesta por Correo",
        "Interés Futuro",
        "Cerrado Perdido",
    ];
    const datos = [5, 8, 30, 12, 7, 4, 10, 3, 6, 2];
    const colores = [
        "#af86ff", "#38b6ff", "#037ce0", "#0057c9", "#00347f",
        "#001959", "#00133b", "#f27100", "#9c16f7", "#3000b3",
    ];

    // Configuración del gráfico
    const data = {
        labels: etapas,
        datasets: [
            {
                label: "Cantidad de prospectos por etapa",
                data: datos,
                backgroundColor: colores,
                borderColor: colores,
                borderWidth: 1,
                barThickness: "flex",
                maxBarThickness: barThickness,
            },
        ],
    };

    // Estados para ajustes responsive del gráfico
    const [tickFontSizeX, setTickFontSizeX] = useState(12);
    const [tickFontSizeY, setTickFontSizeY] = useState(12);
    const [maxRotation, setMaxRotation] = useState(45);
    const [chartHeight, setChartHeight] = useState(500);

    // Opciones del gráfico
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: Math.max(...datos) + 5,
                grid: { color: "#e0e0e0" },
                ticks: {
                    precision: 0,
                    font: { size: tickFontSizeY, weight: "bold" },
                    stepSize: 5,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    autoSkip: false,
                    maxRotation: maxRotation,
                    minRotation: maxRotation,
                    font: { size: tickFontSizeX, weight: "bold" },
                    color: "#333333",
                    padding: 10,
                    callback: function (value, index, values) {
                        const label = this.getLabelForValue(index);
                        if (label.length > 10) {
                            const words = label.split(" ");
                            if (words.length > 1) return words;
                        }
                        return label;
                    },
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#00133b",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                titleFont: { size: 14, weight: "bold" },
                bodyFont: { size: 13 },
                padding: 10,
                displayColors: false,
            },
        },
        layout: {
            padding: { top: 20, bottom: 30, left: 10, right: 10 },
        },
    };

    // Ajusta gráfico según tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 576) {
                setMaxRotation(90);
                setTickFontSizeX(10);
                setTickFontSizeY(10);
                setBarThickness(20);
                setChartHeight(400);
            } else if (width < 768) {
                setMaxRotation(90);
                setTickFontSizeX(11);
                setTickFontSizeY(11);
                setBarThickness(25);
                setChartHeight(450);
            } else if (width < 992) {
                setMaxRotation(45);
                setTickFontSizeX(12);
                setTickFontSizeY(12);
                setBarThickness(30);
                setChartHeight(500);
            } else if (width < 1200) {
                setMaxRotation(45);
                setTickFontSizeX(13);
                setTickFontSizeY(12);
                setBarThickness(35);
                setChartHeight(500);
            } else {
                setMaxRotation(45);
                setTickFontSizeX(14);
                setTickFontSizeY(13);
                setBarThickness(40);
                setChartHeight(550);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Maneja clic en completar tarea
    const handleCompleteTask = (taskTitle) => {
        alert(`Tarea completada: ${taskTitle}`);
    };

    // Maneja clic en reprogramar tarea
    const handleRescheduleTask = (taskTitle) => {
        alert(`Reprogramar tarea: ${taskTitle}`);
    };

    return (
        <>
            <Header />
            <main className="main-content">
                <h1 className="welcome-message">
                    Bienvenido/a {userName}!
                    <img src={welcomeIcon} alt="Icono de Bienvenida" className="welcome-icon" />
                </h1>

                <div className="dashboard-container">
                    <section className="tasks-panel">
                        <h2>Mis tareas pendientes del día de hoy</h2>
                        <div className="task-list">
                            <div className="task-item">
                                <div className="task-info">
                                    <h3>
                                        <img src={phoneIcon} alt="Icono de Teléfono" className="task-icon" />
                                        Nissim Mamiye Gildart - Llamada
                                    </h3>
                                    <div className="task-time">11:00</div>
                                </div>
                                <div className="task-actions">
                                    <button className="btn btn-primary" onClick={() => handleCompleteTask("Nissim Mamiye Gildart - Llamada")}>
                                        Completar
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => handleRescheduleTask("Nissim Mamiye Gildart - Llamada")}>
                                        Reprogramar
                                    </button>
                                </div>
                            </div>
                            <div className="task-item">
                                <div className="task-info">
                                    <h3>
                                        <img src={meetingIcon} alt="Icono de Reunión" className="task-icon" />
                                        Ricardo Gómez Gutiérrez - Reunión
                                    </h3>
                                    <div className="task-time">13:00 - 14:30</div>
                                </div>
                                <div className="task-actions">
                                    <button className="btn btn-primary" onClick={() => handleCompleteTask("Ricardo Gómez Gutiérrez - Reunión")}>
                                        Completar
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => handleRescheduleTask("Ricardo Gómez Gutiérrez - Reunión")}>
                                        Reprogramar
                                    </button>
                                </div>
                            </div>
                            <div className="task-item">
                                <div className="task-info">
                                    <h3>
                                        <img src={emailIcon} alt="Icono de Correo" className="task-icon" />
                                        Sebastián Méndez Flores - Correo
                                    </h3>
                                    <div className="task-time">16:00</div>
                                </div>
                                <div className="task-actions">
                                    <button className="btn btn-primary" onClick={() => handleCompleteTask("Sebastián Méndez Flores - Correo")}>
                                        Completar
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => handleRescheduleTask("Sebastián Méndez Flores - Correo")}>
                                        Reprogramar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="stats-panel">
                        <h2>Estadísticas de Prospectos por Etapa</h2>
                        <div className="chart-container" style={{ height: `${chartHeight}px` }}>
                            <Bar data={data} options={options} id="prospectsChart" />
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};

export default Principal