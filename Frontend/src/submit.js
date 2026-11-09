// submit.js
import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';

export const SubmitButton = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const [isLoading, setIsLoading] = useState(false);
    const [modalState, setModalState] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const submitButtonRef = useRef(null);
    const closeButtonRef = useRef(null);
    const doneButtonRef = useRef(null);

    const closeModal = () => {
        setModalState(null);
    };

    useEffect(() => {
        if (!modalState) {
            submitButtonRef.current?.focus();
            return undefined;
        }

        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeModal();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = [closeButtonRef.current, doneButtonRef.current].filter(Boolean);
            if (focusable.length === 0) {
                return;
            }

            const currentIndex = focusable.indexOf(document.activeElement);
            const nextIndex = event.shiftKey
                ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
                : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);

            event.preventDefault();
            focusable[nextIndex].focus();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modalState]);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('pipeline', JSON.stringify({ nodes, edges }));

            const response = await fetch('http://localhost:8080/pipelines/parse', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            if (data.error) {
                setModalState({
                    title: 'Submission Error',
                    tone: 'error',
                    message: data.error,
                });
            } else {
                const label = data.is_dag ? 'Yes' : 'No';
                const color = data.is_dag ? 'green' : 'red';

                setModalState({
                    title: 'Pipeline Summary',
                    tone: 'success',
                    stats: [
                        { label: 'Nodes', value: data.num_nodes },
                        { label: 'Edges', value: data.num_edges },
                        { label: 'Valid Pipeline', value: label, color },
                    ],
                });
            }
        } catch (error) {
            console.error('Error submitting pipeline:', error);
            setModalState({
                title: 'Submission Error',
                tone: 'error',
                message: 'Error submitting pipeline. Ensure backend is running.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button 
                    ref={submitButtonRef}
                    type="button" 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isLoading ? 0.7 : 1,
                        transform: isHovered && !isLoading ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHovered && !isLoading
                            ? '0 6px 16px rgba(0,0,0,0.15)'
                            : '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                >
                    {isLoading ? 'Submitting...' : 'Submit Pipeline'}
                </button>
            </div>

            {modalState ? (
                <div className="submit-modal__backdrop" onClick={closeModal}>
                    <div
                        className={`submit-modal submit-modal--${modalState.tone}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="submit-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="submit-modal__header">
                            <h3 id="submit-modal-title">{modalState.title}</h3>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                className="submit-modal__close"
                                onClick={closeModal}
                            >
                                x
                            </button>
                        </div>

                        {modalState.message ? (
                            <p className="submit-modal__message">{modalState.message}</p>
                        ) : null}

                        {modalState.stats ? (
                            <div className="submit-modal__stats">
                                {modalState.stats.map((stat) => (
                                    <div key={stat.label} className="submit-modal__stat">
                                        <span className="submit-modal__stat-label">{stat.label}</span>
                                        <span
                                            className={`submit-modal__stat-value ${
                                                stat.color === 'green'
                                                    ? 'submit-modal__stat-value--success'
                                                    : stat.color === 'red'
                                                        ? 'submit-modal__stat-value--error'
                                                        : ''
                                            }`}
                                        >
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="submit-modal__actions">
                            <button
                                ref={doneButtonRef}
                                type="button"
                                className="submit-modal__button"
                                onClick={closeModal}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
