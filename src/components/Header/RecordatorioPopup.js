import { useEffect, useState } from 'react';
import { X, Clock, Video, Phone, MapPin } from 'lucide-react';
import './RecordatorioPopup.css';

const RecordatorioPopup = ({ actividad, onClose, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animación de entrada
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleDismissAndClose = () => {
        onDismiss(actividad.id);
        handleClose();
    };

    const getTipoIcono = () => {
        if (actividad.tipo === 'REUNION') {
            return actividad.modalidad === 'VIRTUAL' ? <Video size={20} /> : <MapPin size={20} />;
        }
        return <Phone size={20} />;
    };

    const getTipoTexto = () => {
        if (actividad.tipo === 'REUNION') {
            return actividad.modalidad === 'VIRTUAL' ? 'Reunión Virtual' : 'Reunión Presencial';
        }
        return 'Llamada';
    };

    return (
        <div className={`recordatorio-popup ${isVisible ? 'visible' : ''}`}>
            <div className="recordatorio-header">
                <div className="recordatorio-icono">
                    {getTipoIcono()}
                </div>
                <div className="recordatorio-titulo">
                    <h4>{getTipoTexto()}</h4>
                    <span className="recordatorio-tiempo">
                        <Clock size={14} />
                        {actividad.tipo === 'LLAMADA' && actividad.minutosRestantes === 0
                            ? '¡Es hora de la llamada!'
                            : `En ${actividad.minutosRestantes} minutos`}
                    </span>
                </div>
                <button className="recordatorio-close" onClick={handleClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="recordatorio-body">
                <p className="recordatorio-trato">{actividad.tratoNombre}</p>
                {actividad.empresaNombre && (
                    <p className="recordatorio-empresa">{actividad.empresaNombre}</p>
                )}

                <div className="recordatorio-detalles">
                    <span className="recordatorio-hora">
                        <Clock size={14} />
                        {actividad.horaInicio}
                    </span>
                    {actividad.duracion && (
                        <span className="recordatorio-duracion">
                            Duración: {actividad.duracion}
                        </span>
                    )}
                </div>

                {actividad.modalidad === 'VIRTUAL' && actividad.enlaceReunion && (
                    <a
                        href={actividad.enlaceReunion}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="recordatorio-link"
                    >
                        Unirse ahora
                    </a>
                )}

                {actividad.modalidad === 'PRESENCIAL' && actividad.lugarReunion && (
                    <p className="recordatorio-lugar">
                        <MapPin size={14} />
                        {actividad.lugarReunion}
                    </p>
                )}
            </div>

            <button className="recordatorio-dismiss" onClick={handleDismissAndClose}>
                No volver a mostrar
            </button>
        </div>
    );
};

export default RecordatorioPopup;