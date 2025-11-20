import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const MFAVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer l'email depuis la navigation ou localStorage
    const userEmail = location.state?.email || localStorage.getItem('pendingVerificationEmail');
    if (!userEmail) {
      navigate('/register');
      return;
    }
    setEmail(userEmail);
    startCountdown();
  }, [location, navigate]);

  const startCountdown = () => {
    setCountdown(600); // 10 minutes en secondes
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbers = pastedData.replace(/\D/g, '').slice(0, 6);
    
    const newCode = [...code];
    numbers.split('').forEach((num, index) => {
      if (index < 6) newCode[index] = num;
    });
    
    setCode(newCode);
    
    // Focus sur le dernier champ rempli
    const lastFilledIndex = numbers.length - 1;
    if (lastFilledIndex < 5) {
      document.getElementById(`code-${lastFilledIndex + 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyMFA({
        email,
        code: verificationCode
      });

      setSuccess('Compte vérifié avec succès !');
      
      // Stocker le token et rediriger
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('pendingVerificationEmail');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la vérification');
      // Réinitialiser le code en cas d'erreur
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0').focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await authService.resendVerificationCode({ email });
      setSuccess('Nouveau code envoyé !');
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📚</span>
            <h1 style={styles.logoText}>Formini</h1>
          </div>
          <h2 style={styles.title}>Vérification du compte</h2>
          <p style={styles.subtitle}>
            Nous avons envoyé un code de vérification à<br />
            <strong style={styles.email}>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.codeContainer}>
            <label style={styles.label}>Code de vérification (6 chiffres)</label>
            <div style={styles.codeInputs}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={styles.codeInput}
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            <div style={styles.timer}>
              ⏱️ Code valide pendant : <strong>{formatTime(countdown)}</strong>
            </div>
          </div>

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(!isCodeComplete || loading ? styles.buttonDisabled : {})
            }}
            disabled={!isCodeComplete || loading}
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Vous n'avez pas reçu le code ?{' '}
            <button
              type="button"
              onClick={handleResendCode}
              style={styles.resendButton}
              disabled={loading || countdown > 570} // Désactiver pendant 30s après envoi
            >
              Renvoyer le code
            </button>
          </p>
          
          <Link to="/register" style={styles.backLink}>
            ← Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fb923c, #ffdab2)',
    padding: '20px',
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  logoText: {
    color: '#f97316',
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  email: {
    color: '#f97316',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  codeContainer: {
    textAlign: 'center',
  },
  label: {
    display: 'block',
    color: '#374151',
    fontWeight: '500',
    marginBottom: '15px',
    fontSize: '0.9rem',
  },
  codeInputs: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  codeInput: {
    width: '50px',
    height: '60px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: '#f8f9fc',
  },
  timer: {
    color: '#6b7280',
    fontSize: '0.85rem',
    marginBottom: '10px',
  },
  button: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
    border: '1px solid #fecaca',
  },
  success: {
    background: '#f0fdf4',
    color: '#16a34a',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
    border: '1px solid #bbf7d0',
  },
  footer: {
    textAlign: 'center',
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '15px',
  },
  resendButton: {
    background: 'none',
    border: 'none',
    color: '#f97316',
    cursor: 'pointer',
    fontWeight: '500',
    textDecoration: 'underline',
  },
  backLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
};

// Styles dynamiques pour les effets
const styleElement = document.createElement('style');
styleElement.textContent = `
  .code-input:focus {
    border-color: #f97316 !important;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1) !important;
    background: white !important;
  }
  
  .button:hover:not(:disabled) {
    background: #ea580c !important;
    transform: translateY(-2px) !important;
  }
  
  .resend-button:hover:not(:disabled) {
    color: #ea580c !important;
  }
  
  .back-link:hover {
    color: #f97316 !important;
  }
`;
document.head.appendChild(styleElement);

export default MFAVerification;