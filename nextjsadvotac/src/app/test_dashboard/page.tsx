'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserData {
  name: string;
  email: string;
  image?: string;
}

export default function TestDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'text' | 'pdf' | 'docx'>('text');
  const [copySuccess, setCopySuccess] = useState(false);

  const suggestedQuestions = [
    "What are the key provisions of the Indian Contract Act?",
    "Explain the difference between civil and criminal law in India",
    "What are the grounds for divorce under Hindu Marriage Act?",
    "Explain the concept of intellectual property rights"
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('🔄 [DASHBOARD] Dashboard component mounted, checking authentication...');
      console.log('🔄 [DASHBOARD] Current URL:', window.location.href);
      
      // Check if user is authenticated via FastAPI token
      const token = localStorage.getItem('authToken');
      const storedUserDataRaw = localStorage.getItem('userData');
      
      console.log('🔍 [DASHBOARD] Checking localStorage for authentication...');
      console.log('🔍 [DASHBOARD] authToken found:', !!token);
      console.log('🔍 [DASHBOARD] userData found:', !!storedUserDataRaw);
      
      if (token) {
        console.log('✅ [DASHBOARD] Token found in localStorage:', token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.error('❌ [DASHBOARD] No authentication token found');
        console.log('🔄 [DASHBOARD] Redirecting to /auth...');
        router.push('/auth');
        return;
      }

      try {
        setLoading(true);
        console.log('📡 [DASHBOARD] Fetching user profile from FastAPI backend...');
        
        // Fetch user data from FastAPI backend
        const response = await fetch('http://localhost:8000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 [DASHBOARD] API Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error('❌ [DASHBOARD] Token invalid or expired (status:', response.status, ')');
            console.log('🧹 [DASHBOARD] Clearing localStorage and redirecting to /auth...');
            // Token is invalid or expired, redirect to auth
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            router.push('/auth');
            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [DASHBOARD] User data received from API:', {
          hasName: !!(data.name || data.full_name),
          hasEmail: !!data.email,
          hasImage: !!(data.image || data.profile_picture || data.picture)
        });
        
        const finalUserData = {
          name: data.name || data.full_name || 'User',
          email: data.email || '',
          image: data.image || data.profile_picture || data.picture,
        };
        
        console.log('💾 [DASHBOARD] Setting user data in state:', {
          name: finalUserData.name,
          email: finalUserData.email,
          hasImage: !!finalUserData.image
        });
        
        setUserData(finalUserData);
        
      } catch (error) {
        console.error('❌ [DASHBOARD] Error fetching user data from API:', error);
        console.error('❌ [DASHBOARD] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Failed to load user data');
        
        // Fall back to localStorage data if API fails
        console.log('🔄 [DASHBOARD] Attempting fallback to localStorage data...');
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            console.log('📦 [DASHBOARD] Parsing stored user data from localStorage...');
            const parsedData = JSON.parse(storedUserData);
            console.log('✅ [DASHBOARD] Successfully parsed localStorage data:', {
              hasName: !!parsedData.name,
              hasEmail: !!parsedData.email,
              hasImage: !!parsedData.image
            });
            
            const fallbackUserData = {
              name: parsedData.name || 'User',
              email: parsedData.email || '',
              image: parsedData.image,
            };
            
            console.log('💾 [DASHBOARD] Using fallback user data from localStorage');
            setUserData(fallbackUserData);
          } catch (parseError) {
            console.error('❌ [DASHBOARD] Error parsing stored user data:', parseError);
            console.log('🔄 [DASHBOARD] Redirecting to /auth due to parse error...');
            router.push('/auth');
          }
        } else {
          console.error('❌ [DASHBOARD] No fallback data available in localStorage');
        }
      } finally {
        setLoading(false);
        console.log('✅ [DASHBOARD] User data fetch complete');
      }
    };

    fetchUserData();
  }, [router]);

  const handleSignOut = () => {
    console.log('🚪 [DASHBOARD] Sign out initiated...');
    console.log('🧹 [DASHBOARD] Clearing authentication data from localStorage...');
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    console.log('✅ [DASHBOARD] localStorage cleared');
    console.log('🔄 [DASHBOARD] Redirecting to /auth...');
    
    router.push('/auth');
  };

  const handleGenerateResponse = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // Simulate AI response - Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResponse = `This is a detailed legal analysis for: "${question}"\n\n` +
        `Based on Indian law and regulations:\n\n` +
        `1. Legal Framework: The relevant legal provisions...\n` +
        `2. Key Considerations: Important factors to consider...\n` +
        `3. Precedents: Related case laws and judgments...\n` +
        `4. Recommendations: Suggested course of action...\n\n` +
        `Note: This is a general overview. Please consult a legal professional for specific advice.`;
      
      setResponse(mockResponse);
    } catch (err) {
      console.error('Error generating response:', err);
      setError('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!response) return;
    
    navigator.clipboard.writeText(response).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    });
  };

  const handleDownloadPDF = () => {
    if (!response) return;
    
    // Create a simple text file for now - you can integrate a proper PDF library later
    const element = document.createElement('a');
    const file = new Blob([response], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `legal-response-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDocx = () => {
    if (!response) return;
    
    // Create a simple text file for now - you can integrate a proper DOCX library later
    const element = document.createElement('a');
    const file = new Blob([response], { type: 'application/msword' });
    element.href = URL.createObjectURL(file);
    element.download = `legal-response-${Date.now()}.doc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSuggestedQuestion = (suggestedQ: string) => {
    setQuestion(suggestedQ);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style dangerouslySetInnerHTML={{
          __html: '@keyframes spin { to { transform: rotate(360deg); } }'
        }} />
        <p style={{ marginTop: '16px', fontSize: '18px' }}>Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1a202c',
            marginBottom: '8px',
          }}>
            Test Dashboard
          </h1>
          <p style={{
            color: '#718096',
            fontSize: '16px',
          }}>
            AI Legal Assistant
          </p>
          <div style={{
            marginTop: '8px',
            padding: '4px 12px',
            backgroundColor: '#48bb78',
            color: 'white',
            borderRadius: '12px',
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            v2.0 Enhanced ✨
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '24px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Profile Image */}
        {userData.image && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <img 
              src={userData.image}
              alt={userData.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '4px solid #667eea',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* User Information - Compact */}
        <div style={{
          backgroundColor: '#f7fafc',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: '4px',
            }}>
              {userData.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#718096',
            }}>
              {userData.email}
            </div>
          </div>
        </div>

        {/* AI Legal Assistant Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '2px solid #e2e8f0',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '16px',
          }}>
            Ask Legal Questions
          </h2>

          {/* Question Input */}
          <div style={{ marginBottom: '16px' }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your legal question here..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                fontSize: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            />
          </div>

          {/* Suggested Questions */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568',
              marginBottom: '8px',
            }}>
              Suggested Questions
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {suggestedQuestions.map((sq, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(sq)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    backgroundColor: '#f7fafc',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#edf2f7';
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.color = '#667eea';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#4a5568';
                  }}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateResponse}
            disabled={isGenerating || !question.trim()}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isGenerating || !question.trim() ? '#cbd5e0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isGenerating || !question.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
            onMouseOver={(e) => {
              if (!isGenerating && question.trim()) {
                e.currentTarget.style.backgroundColor = '#5568d3';
              }
            }}
            onMouseOut={(e) => {
              if (!isGenerating && question.trim()) {
                e.currentTarget.style.backgroundColor = '#667eea';
              }
            }}
          >
            {isGenerating ? 'Generating Response...' : 'Generate Response'}
          </button>

          {/* Response Section */}
          {response && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f7fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1a202c',
                }}>
                  Response
                </h3>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Copy Button - Always Available */}
                  <button
                    onClick={handleCopyToClipboard}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: copySuccess ? '#48bb78' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500',
                    }}
                    onMouseOver={(e) => {
                      if (!copySuccess) {
                        e.currentTarget.style.backgroundColor = '#5568d3';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!copySuccess) {
                        e.currentTarget.style.backgroundColor = '#667eea';
                      }
                    }}
                  >
                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                  </button>

                  {/* PDF Download */}
                  <button
                    onClick={handleDownloadPDF}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: '#38b2ac',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#319795';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#38b2ac';
                    }}
                  >
                    📄 PDF
                  </button>

                  {/* DOCX Download */}
                  <button
                    onClick={handleDownloadDocx}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: '#4299e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#3182ce';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#4299e1';
                    }}
                  >
                    📝 DOCX
                  </button>
                </div>
              </div>

              {/* Response Text */}
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#2d3748',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
              }}>
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#5568d3';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Sign Out
        </button>

        {/* Back to Dashboard Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
        }}>
          <a
            href="/dashboard"
            style={{
              color: '#667eea',
              fontSize: '14px',
              textDecoration: 'none',
              fontWeight: '500',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Go to Full Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
