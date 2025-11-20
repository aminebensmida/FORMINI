import React, { useState } from "react";
import { authService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import signupImage from "../assets/images/signup.png";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    pass: "",
    pass2: "",
    role: "student",
    agree: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.pass !== formData.pass2) {
      alert("❌ Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }
    if (!formData.agree) {
      alert("❌ Vous devez accepter les conditions");
      setLoading(false);
      return;
    }

    try {
      // Utiliser registerWithMFA au lieu de register
      const response = await authService.registerWithMFA({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mdp: formData.pass,
        role: formData.role,
      });
      
      // Stocker l'email pour la vérification MFA
      localStorage.setItem('pendingVerificationEmail', formData.email);
      
      // Rediriger vers la page de vérification MFA
      navigate('/verify-mfa', { 
        state: { email: formData.email } 
      });
      
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ---- LEFT FORM ---- */}
        <div style={styles.left}>
          <h1 style={styles.title}>Create an account</h1>
          <p style={styles.subtitle}>Start your learning journey today</p>

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* NOM / PRENOM */}
            <div style={styles.nameRow}>
              <div style={styles.inputGroupHalf}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Last Name"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroupHalf}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="First Name"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                name="pass"
                value={formData.pass}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="password"
                placeholder="Confirm Password"
                name="pass2"
                value={formData.pass2}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="8"
              />
            </div>

            {/* ROLE */}
            <div style={styles.inputGroup}>
              <select
                style={styles.input}
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="student">🎓 Student</option>
                <option value="instructor">👨‍🏫 Instructor</option>
                <option value="admin">⚙️ Admin</option>
              </select>
            </div>

            {/* TERMS */}
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                disabled={loading}
              />
              <span style={{ marginLeft: 8 }}>
                I accept the <a href="#" style={styles.link}>Terms & Conditions</a>
              </span>
            </div>

            <button 
              style={{
                ...styles.button,
                ...(loading && styles.buttonLoading)
              }}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account ?{" "}
            <Link to="/login" style={styles.link2}>
              Log in
            </Link>
          </p>
        </div>

        {/* ---- RIGHT IMAGE ---- */}
        <div style={styles.right}>
          <img src={signupImage} alt="signup" style={styles.image} />
        </div>

      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = {
  page: {
    width: "100%",
    height: "100vh",
    background: "linear-gradient(120deg, #fccca7ff, #fccca7ff, #fccca7ff)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, Arial",
  },

  card: {
    width: "80%",
    height:"95%",
    maxWidth: "1200px",
    background: "#fff",
    borderRadius: "25px",
    boxShadow: "20px 20px 20px 20px rgba(0,0,0,0.1)",
    display: "flex",
    overflow: "hidden",
  },

  left: {
    width: "45%",
    padding: "50px",
  },

  right: {
    width: "55%",
    background: "#e6e6e6ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "90%",
  },

  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#2b2d42",
  },

  subtitle: {
    marginTop: "5px",
    fontSize: "15px",
    color: "#6b7280",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  nameRow: {
    display: "flex",
    gap: "15px",
  },

  inputGroupHalf: {
    flex: 1,
    background: "#f8f9fc",
    borderRadius: "10px",
    border: "1px solid #dfe3f0",
    padding: "12px",
  },

  inputGroup: {
    background: "#f8f9fc",
    borderRadius: "10px",
    border: "1px solid #dfe3f0",
    padding: "12px",
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
  },

  checkboxRow: {
    marginTop: "10px",
  },

  button: {
    marginTop: "10px",
    background: "#4f46e5",
    padding: "14px",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },

  buttonLoading: {
    opacity: "0.7",
    cursor: "not-allowed",
  },

  link: {
    color: "#4f46e5",
    textDecoration: "none",
  },

  link2: {
    color: "#6d28d9",
    fontWeight: "bold",
    textDecoration: "none",
  },

  footer: {
    marginTop: "20px",
    fontSize: "14px",
  },
};