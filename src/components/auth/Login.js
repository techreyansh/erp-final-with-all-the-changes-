import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Container,
  Alert,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Grow,
} from "@mui/material";
import {
  Factory,
  Dashboard,
  TrendingUp,
  Security,
} from "@mui/icons-material";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getGoogleWebClientId } from "../../lib/googleWebClientId";

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const features = [
    { icon: <Dashboard />, text: "Streamlined Sales Order Ingestion", color: theme.palette.primary.main },
    { icon: <TrendingUp />, text: "Real-time Order to Dispatch System", color: theme.palette.success.main },
    { icon: <Factory />, text: "Executive Dashboard with KPIs", color: theme.palette.warning.main },
  ];
  
  const { error: authError, authLoading, syncUserFromSupabase, clearAuthSurfaceErrors } = useAuth();
  const googleWebClientId = getGoogleWebClientId();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [oauthStarting, setOauthStarting] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);

  // Check for session expiration message from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_expired') === 'true') {
      setSessionExpiredMsg('Your session has expired. Please sign in again.');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // After auth hydrates: push Supabase session into React state, then route (ProtectedRoute reads `user`, not getSession)
  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    (async () => {
      const hasSession = await syncUserFromSupabase();
      if (cancelled) return;
      if (hasSession) {
        navigate("/home", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, navigate, syncUserFromSupabase]);

  /** Requires REACT_APP_GOOGLE_OAUTH_CLIENT_ID — redirect OAuth is disabled (it hits "Unable to exchange external code"). */
  const handleGoogleCredential = async (credentialResponse) => {
    const token = credentialResponse?.credential;
    if (!token) {
      setError("Google did not return a sign-in token.");
      return;
    }
    clearAuthSurfaceErrors();
    setOauthStarting(true);
    try {
      const { error: idErr } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token,
      });
      if (idErr) {
        console.error("signInWithIdToken:", idErr);
        setError(
          idErr.message ||
            "Google token was rejected by Supabase. Enable Google provider and use the same Web Client ID in Dashboard and in REACT_APP_GOOGLE_OAUTH_CLIENT_ID."
        );
        return;
      }
      await syncUserFromSupabase();
      navigate("/home", { replace: true });
    } catch (e) {
      console.error("Google ID sign-in exception:", e);
      setError("Google sign-in failed unexpectedly.");
    } finally {
      setOauthStarting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        }
      }}
    >
      {/* Floating animated elements */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          animation: "float 6s ease-in-out infinite",
          "@keyframes float": {
            "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          right: "15%",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          animation: "float 8s ease-in-out infinite reverse",
          "@keyframes float": {
            "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
          },
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          {/* Left panel: App info and features */}
          <Grid item xs={12} lg={6}>
            <Fade in timeout={1000}>
              <Box
                sx={{
                  color: "white",
                  textAlign: isMobile ? "center" : "left",
                  mb: isMobile ? 4 : 0,
                  maxWidth: 500,
                  mx: "auto",
                }}
              >
                {/* Logo/Brand Section */}
                <Slide direction="right" in timeout={600}>
                  <Box sx={{ mb: 5, textAlign: isMobile ? "center" : "left" }} className="motion-fade-in">
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderRadius: 4,
                        px: 4,
                        py: 2,
                        mb: 4,
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease",
                        "&:hover": {
                          transform: "scale(1.02)",
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    >
                      <img
                        src={process.env.PUBLIC_URL + "/reyansh-logo.png"}
                        alt="Reyansh International"
                        onError={(e) => {
                          e.target.style.display = "none";
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                        style={{
                          maxHeight: 32,
                          width: "auto",
                          objectFit: "contain",
                          marginRight: 16,
                        }}
                      />
                      <Box
                        sx={{
                          display: "none",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Factory sx={{ fontSize: 28, color: theme.palette.warning.main }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: "0.5px" }}>
                          Reyansh International
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Slide>

                {/* Main Title */}
                <Slide direction="up" in timeout={1000}>
                  <Typography
                    variant={isMobile ? "h3" : "h2"}
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      mb: 3,
                      lineHeight: 1.1,
                      textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Factory Operations
                    <br />
                    <Box component="span" sx={{ 
                      color: "#fbbf24",
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    }}>
                      Monitoring System
                    </Box>
                  </Typography>
                </Slide>

                {/* Subtitle */}
                <Slide direction="up" in timeout={1200}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 5,
                      opacity: 0.95,
                      fontWeight: 400,
                      lineHeight: 1.7,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Access the centralized platform for PO tracking, flow management,
                    and operations analytics in real-time with enterprise-grade security.
                  </Typography>
                </Slide>

                {/* Features List */}
                <Box sx={{ mb: 5 }}>
                  {features.map((feature, index) => (
                    <Grow in timeout={1400 + index * 200} key={index}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 3,
                          p: 3,
                          backgroundColor: "rgba(255, 255, 255, 0.12)",
                          borderRadius: 3,
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.18)",
                            transform: "translateY(-2px) scale(1.02)",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                          }
                        }}
                      >
                        <Box
                          sx={{
                            backgroundColor: feature.color,
                            borderRadius: "50%",
                            p: 1.5,
                            mr: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 12px ${feature.color}40`,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "scale(1.1) rotate(5deg)",
                            },
                          }}
                        >
                          {React.cloneElement(feature.icon, { 
                            sx: { color: "white", fontSize: 24 } 
                          })}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: "0.01em" }}>
                          {feature.text}
                        </Typography>
                      </Box>
                    </Grow>
                  ))}
                </Box>

                {/* Security Badge */}
                <Grow in timeout={2000}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor: "rgba(34, 197, 94, 0.25)",
                      borderRadius: 3,
                      px: 3,
                      py: 2,
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      backdropFilter: "blur(20px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        backgroundColor: "rgba(34, 197, 94, 0.3)",
                      },
                    }}
                  >
                    <Security sx={{ fontSize: 20, mr: 1.5, color: "#22c55e" }} />
                    <Typography variant="body1" sx={{ color: "#22c55e", fontWeight: 600, letterSpacing: "0.02em" }}>
                      Enterprise-Grade Security
                    </Typography>
                  </Box>
                </Grow>
              </Box>
            </Fade>
          </Grid>

          {/* Right panel: Login form */}
          <Grid item xs={12} lg={6}>
            <Fade in timeout={1500}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Card
                  elevation={0}
                  sx={{
                    width: "100%",
                    maxWidth: 480,
                    borderRadius: 4,
                    overflow: "hidden",
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(30px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 40px 80px -16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 5 }}>
                    {/* Header */}
                    <Slide direction="down" in timeout={1600}>
                      <Box sx={{ textAlign: "center", mb: 5 }}>
                        <Typography variant="h3" gutterBottom sx={{ 
                          fontWeight: 800, 
                          color: "#1e293b",
                          letterSpacing: "-0.02em",
                          mb: 1,
                        }}>
                          Welcome Back
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Sign in to access your dashboard
                        </Typography>
                      </Box>
                    </Slide>

                    {/* Session expired message */}
                    {sessionExpiredMsg && (
                      <Grow in timeout={200}>
                        <Alert 
                          severity="info" 
                          sx={{ 
                            mb: 3, 
                            borderRadius: 3,
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffc107",
                            color: "#856404",
                            "& .MuiAlert-icon": { fontSize: 24, color: "#ffc107" }
                          }}
                          onClose={() => setSessionExpiredMsg(null)}
                        >
                          {sessionExpiredMsg}
                        </Alert>
                      </Grow>
                    )}

                    {!googleWebClientId && (
                      <Grow in timeout={250}>
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Google sign-in is misconfigured for this project
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            In the project root file <code style={{ fontSize: "0.85em" }}>.env</code>, the line{" "}
                            <code style={{ fontSize: "0.85em" }}>REACT_APP_GOOGLE_OAUTH_CLIENT_ID</code> must
                            have your real <strong>Web Client ID</strong> after the <code>=</code>. If there is
                            nothing after <code>=</code>, the button stays hidden.
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Copy the Client ID from: Supabase → <strong>Authentication</strong> →{" "}
                            <strong>Providers</strong> → <strong>Google</strong> (same value you already use
                            there).
                          </Typography>
                          <Typography
                            component="pre"
                            sx={{
                              m: 0,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: "grey.100",
                              fontSize: "0.8rem",
                              overflow: "auto",
                            }}
                          >
                            REACT_APP_GOOGLE_OAUTH_CLIENT_ID=123456789-abc.apps.googleusercontent.com
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Save <code>.env</code>, stop the dev server (Ctrl+C), run <code>npm start</code>{" "}
                            again. Full-page redirect sign-in is <strong>disabled</strong> here (it caused
                            &quot;Unable to exchange external code&quot;).
                          </Typography>
                        </Alert>
                      </Grow>
                    )}

                    {/* Error alert */}
                    {(error || authError) && (
                      <Grow in timeout={200}>
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mb: 4, 
                            borderRadius: 3,
                            maxHeight: 520,
                            overflow: "auto",
                            "& .MuiAlert-message": { width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word" },
                            "& .MuiAlert-icon": { fontSize: 24, alignSelf: "flex-start" }
                          }}
                        >
                          {error || authError}
                        </Alert>
                      </Grow>
                    )}

                    {/* Google: ID token only (no redirect — avoids broken Supabase code exchange). */}
                    <Grow in timeout={2000}>
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        {googleWebClientId ? (
                          <Box
                            sx={{
                              width: "100%",
                              display: "flex",
                              justifyContent: "center",
                              opacity: oauthStarting ? 0.65 : 1,
                              pointerEvents: oauthStarting ? "none" : "auto",
                              "& iframe": { width: "100% !important", maxWidth: 400 },
                            }}
                          >
                            <GoogleLogin
                              onSuccess={(c) => void handleGoogleCredential(c)}
                              onError={() =>
                                setError("Google sign-in was cancelled or could not start.")
                              }
                              useOneTap={false}
                              theme="outline"
                              size="large"
                              text="signin_with"
                              shape="rectangular"
                              width={360}
                            />
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ px: 1 }}
                          >
                            No button yet: paste your Web Client ID after the <code>=</code> in{" "}
                            <code>.env</code>, then restart <code>npm start</code> (Create React App only reads{" "}
                            <code>.env</code> when the server starts).
                          </Typography>
                        )}
                      </Box>
                    </Grow>

                    {/* Additional info text */}
                    <Grow in timeout={2200}>
                      <Box sx={{ mt: 5, mb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            textAlign: "center",
                            lineHeight: 1.6,
                            px: 2,
                          }}
                        >
                          Use your authorized Google account to sign in and access the Reyansh ERP dashboard.
                        </Typography>
                      </Box>
                    </Grow>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          </Grid>
        </Grid>

      </Container>
    </Box>
  );
};

export default Login;
