import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/custom.css";
import CustomAlert from "../components/CustomAlert";
import { useAuth } from "../components/AuthContext";
import API_BASE_URL from '../config/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    correo: "",
    contrasena: "",
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  });

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setChangePasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://18.219.64.19:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        const usuario = data.usuario;
        localStorage.setItem("rol", usuario.rol);
        localStorage.setItem("usuario", JSON.stringify(usuario));

        if (usuario.contrasena_temporal) {
          setCurrentUser(usuario);
          setShowChangePassword(true);
          setChangePasswordData((prev) => ({
            ...prev,
            contrasenaActual: loginData.contrasena,
          }));
        } else {
          login(usuario);
          setAlertConfig({
            isOpen: true,
            title: "¡Bienvenido!",
            message: `Hola ${usuario.nombre}, has iniciado sesión correctamente.`,
            type: "success",
          });
          setTimeout(() => {
            navigate("/home");
          }, 1000);
        }
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Error de acceso",
          message: data.message || "Credenciales incorrectas",
          type: "error",
        });
      }
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Error de conexión",
        message: "No se pudo conectar con el servidor. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      changePasswordData.nuevaContrasena !==
      changePasswordData.confirmarContrasena
    ) {
      setAlertConfig({
        isOpen: true,
        title: "Error de validación",
        message: "Las contraseñas no coinciden",
        type: "error",
      });
      return;
    }

    if (changePasswordData.nuevaContrasena.length < 6) {
      setAlertConfig({
        isOpen: true,
        title: "Contraseña muy corta",
        message: "La nueva contraseña debe tener al menos 6 caracteres",
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://18.219.64.19:3001/usuarios/${currentUser.id}/cambiar-contrasena`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contrasenaActual: changePasswordData.contrasenaActual,
            nuevaContrasena: changePasswordData.nuevaContrasena,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const usuarioActualizado = { ...currentUser, contrasena_temporal: false };
        login(usuarioActualizado);

        setAlertConfig({
          isOpen: true,
          title: "¡Contraseña actualizada!",
          message: `Perfecto ${currentUser.nombre}, tu contraseña se ha actualizado correctamente.`,
          type: "success",
        });
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
      setAlertConfig({
        isOpen: true,
        title: "Error al actualizar",
        message: data.message || "No se pudo actualizar la contraseña",
        type: "error",
      });
    }
  } catch (error) {
    setAlertConfig({
      isOpen: true,
      title: "Error de conexión",
      message: "No se pudo conectar con el servidor. Intenta nuevamente.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};

const resetChangePassword = () => {
  setShowChangePassword(false);
  setChangePasswordData({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  });
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
                      "linear-gradient(135deg,rgb(250, 153, 74) 0%,rgb(248, 200, 141) 80%)",
                    borderRadius: "30px",
                  }}
                >
                  <i className="fas fa-leaf text-white fs-4"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">¡Bienvenido!</h3>
                <p className="text-muted">Inicia sesión en tu cuenta</p>
              </div>

              {!showChangePassword ? (
                <form onSubmit={handleLogin}>
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
                        name="correo"
                        value={loginData.correo}
                        onChange={handleLoginChange}
                        required
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">
                      Contraseña
                    </label>
                    <div
                      className="input-group"
                      style={{ borderRadius: "12px" }}
                    >
                      <span className="input-group-text border-end-0 bg-transparent">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0 ps-0"
                        style={{
                          borderRadius: "0 12px 12px 0",
                          boxShadow: "none",
                          fontSize: "16px",
                        }}
                        name="contrasena"
                        value={loginData.contrasena}
                        onChange={handleLoginChange}
                        required
                        placeholder="Ingresa tu contraseña"
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
                      className="btn py-1 px-3 fw-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #FFF3E0 0%, #FFCC80 100%)",
                        borderRadius: "15px",
                        color: "#5D4037",
                        fontSize: "11px",
                        border: "none",
                        minWidth: "140px",
                      }}
                      disabled={loading}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 8px 32px rgba(251, 229, 195, 0.79)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 4px 20px rgba(253, 228, 191, 0.74)";
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-2"></i>
                          Iniciar Sesión
                        </>
                      )}
                    </button>
                  </div>

                  {/* Enlace de recuperar contraseña FUERA del div del botón */}
                  <div className="text-center mt-3">
                    <Link
                      to="/recuperar-contrasena"
                      className="text-decoration-none"
                      style={{ color: "#fd7e14" }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        marginTop: "10px",
                        background:
                          "linear-gradient(135deg, #28a745 0%,rgb(53, 231, 178) 100%)",
                        borderRadius: "15px",
                      }}
                    >
                      <i className="fas fa-key fa-lg text-white"></i>
                    </div>
                    <h4 className="fw-bold text-dark mb-2">
                      Cambiar Contraseña
                    </h4>
                    <p className="text-muted">
                      Establece tu nueva contraseña segura
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid #e9ecef",
                          fontSize: "16px",
                          padding: "12px 16px",
                        }}
                        name="contrasenaActual"
                        value={changePasswordData.contrasenaActual}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Contraseña temporal"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid #e9ecef",
                          fontSize: "16px",
                          padding: "12px 16px",
                        }}
                        name="nuevaContrasena"
                        value={changePasswordData.nuevaContrasena}
                        onChange={handlePasswordChange}
                        required
                        minLength="6"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid #e9ecef",
                          fontSize: "16px",
                          padding: "12px 16px",
                        }}
                        name="confirmarContrasena"
                        value={changePasswordData.confirmarContrasena}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Repite la nueva contraseña"
                      />
                    </div>

                    <div className="d-grid gap-3">
                      <button
                        type="submit"
                        className="btn py-2 fw-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg,rgb(46, 180, 77) 0%, #20c997 100%)",
                          border: "none",
                          borderRadius: "12px",
                          color: "white",
                          fontSize: "13px",
                          boxShadow: "0 8px 32px rgba(40, 167, 69, 0.4)",
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></span>
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Actualizar Contraseña
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary py-1"
                        style={{ borderRadius: "12px" }}
                        onClick={resetChangePassword}
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Custom Alert */}
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

export default Login;