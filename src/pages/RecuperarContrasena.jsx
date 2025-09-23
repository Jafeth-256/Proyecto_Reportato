import React, { useState } from "react";
import { Link } from "react-router-dom";
import CustomAlert from "../components/CustomAlert";
import API_BASE_URL from '../config/api';

const RecuperarContrasena = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/recuperar-contrasena`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: email }),
            });

            const data = await response.json();

            if (response.ok) {
                setAlertConfig({
                    isOpen: true,
                    title: "¡Correo enviado!",
                    message: "Se ha enviado una nueva contraseña temporal a tu correo electrónico. Deberás cambiarla al iniciar sesión.",
                    type: "success",
                });
                setEmail("");
            } else {
                setAlertConfig({
                    isOpen: true,
                    title: "Error",
                    message: data.message || "No se pudo enviar el correo",
                    type: "error",
                });
            }
        } catch (error) {
            setAlertConfig({
                isOpen: true,
                title: "Error de conexión",
                message: "No se pudo conectar con el servidor.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="login-container min-vh-100"
            style={{
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* División amarilla */}
            <div
                style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    width: "50%",
                    height: "100%",
                    background: "#fd7e14",
                    borderTopLeftRadius: "0px",
                    borderBottomLeftRadius: "0px",
                }}
            ></div>

            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="row justify-content-center w-100">
                    <div className="col-md-6 col-lg-4">
                        <div
                            className="card border-0 shadow-lg"
                            style={{
                                background: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(20px)",
                                borderRadius: "20px",
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center mb-5"
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            background:
                                                "linear-gradient(135deg, #28a745 0%, rgb(53, 231, 178) 100%)",
                                            borderRadius: "30px",
                                        }}
                                    >
                                        <i className="fas fa-envelope text-white fs-4"></i>
                                    </div>
                                    <h3 className="fw-bold text-dark mb-2">Recuperar Contraseña</h3>
                                    <p className="text-muted">Ingresa tu correo electrónico</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-dark">
                                            Correo Electrónico
                                        </label>
                                        <div
                                            className="input-group"
                                            style={{ borderRadius: "12px" }}
                                        >
                                            <span className="input-group-text border-end-0 bg-transparent">
                                                <i className="fas fa-envelope text-muted"></i>
                                            </span>
                                            <input
                                                type="email"
                                                className="form-control border-start-0 ps-0"
                                                style={{
                                                    borderRadius: "0 12px 12px 0",
                                                    boxShadow: "none",
                                                    fontSize: "16px",
                                                }}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="ejemplo@correo.com"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            marginTop: "20px",
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="btn py-2 fw-semibold"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, rgb(46, 180, 77) 0%, #20c997 100%)",
                                                borderRadius: "15px",
                                                color: "white",
                                                fontSize: "13px",
                                                border: "none",
                                                minWidth: "200px",
                                                boxShadow: "0 8px 32px rgba(40, 167, 69, 0.4)",
                                            }}
                                            disabled={loading}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = "translateY(-2px)";
                                                    e.target.style.boxShadow =
                                                        "0 12px 40px rgba(40, 167, 69, 0.6)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.target.style.transform = "translateY(0)";
                                                    e.target.style.boxShadow =
                                                        "0 8px 32px rgba(40, 167, 69, 0.4)";
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    ></span>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-paper-plane me-2"></i>
                                                    Enviar Nueva Contraseña
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="text-center mt-4">
                                        <Link
                                            to="/login"
                                            className="text-decoration-none"
                                            style={{ color: "#fd7e14" }}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Volver al Login
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CustomAlert
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
};

export default RecuperarContrasena;