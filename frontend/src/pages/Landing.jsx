import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Landing = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#9333ea', /* Fallback */
      background: 'radial-gradient(circle at 30% 20%, #6b21a8 0%, #9333ea 50%, #c084fc 100%)',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Navbar Section */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 3rem',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        letterSpacing: '0.05em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '800' }}>
          <Activity size={24} />
          HEALTHMATE
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>LOG IN</Link>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              padding: '0.8rem 1.5rem',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}>
              GET STARTED
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        display: 'flex',
        flex: 1,
        padding: '4rem 4rem 0 4rem',
        gap: '4rem',
        alignItems: 'center'
      }}>
        {/* Left Content */}
        <div style={{ flex: 1, maxWidth: '600px', alignSelf: 'flex-start', paddingTop: '4rem' }}>
          <h1 style={{ 
            fontSize: '5.5rem', 
            fontWeight: '800', 
            lineHeight: '0.95', 
            marginBottom: '2rem',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase'
          }}>
            EVERYTHING TO TRACK YOUR HEALTH
          </h1>
          <p style={{ 
            fontSize: '1.4rem', 
            marginBottom: '2.5rem', 
            lineHeight: '1.4',
            fontWeight: '400',
            maxWidth: '500px'
          }}>
            Start your free health monitoring today.<br/>
            No credit card required.
          </p>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              padding: '1.2rem 2.5rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              cursor: 'pointer'
            }}>
              GET STARTED
            </button>
          </Link>
        </div>

        {/* Right Content - Mockup */}
        <div style={{ flex: 1.2, display: 'flex', justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            width: '100%',
            height: '600px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px 24px 0 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Screen Inner */}
            <div style={{
              backgroundColor: '#f3e8ff',
              flex: 1,
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Mockup Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                padding: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: '#4c1d95',
                letterSpacing: '0.1em'
              }}>
                <span>HOME</span>
                <span>SYMPTOMS</span>
                <span>MEDICINES</span>
                <span>CHAT</span>
                <span>HISTORY</span>
              </div>
              
              {/* Mockup Center Graphic */}
              <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '6rem',
                  fontWeight: '900',
                  color: '#4c1d95',
                  lineHeight: '0.85',
                  letterSpacing: '-0.03em',
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                }}>
                  HealthMate<br/>AI
                </h2>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  right: '25%',
                  border: '2px solid #db2777',
                  borderRadius: '50%',
                  padding: '10px 20px',
                  transform: 'rotate(-5deg)',
                  color: '#db2777',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  zIndex: 3
                }}>
                  TRY NOW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
