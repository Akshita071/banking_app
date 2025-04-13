// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import { authService } from '../services/authService'; // Adjust path if needed
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService'; // Adjust path if needed

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
        });
    } catch (e) { return dateString; }
};
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
};
// ---

function DashboardPage() {
    const { user, logout: contextLogout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [accountData, setAccountData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- NEW STATE ---
    const [showTransactions, setShowTransactions] = useState(false); // State to toggle transaction visibility

    useEffect(() => {
        // --- Fetching logic remains the same ---
        if (!user) { setIsLoading(false); return; }
        const fetchData = async () => {
            // Reset states on fetch start
            setIsLoading(true);
            setError(null);
            setShowTransactions(false); // Hide transactions on new fetch/refresh
            try {
                const [profile, accountResponse] = await Promise.all([
                    apiService.getProfile(),
                    apiService.getAccountData()
                ]);
                setProfileData(profile);
                if (Array.isArray(accountResponse) && accountResponse.length > 0) {
                    setAccountData(accountResponse[0]);
                } else if (typeof accountResponse === 'object' && accountResponse !== null) {
                    setAccountData(accountResponse);
                } else { setAccountData(null); }
            } catch (err) {
                setError(err.message || "Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]); // Dependency array

    const handleLogout = async () => {
        try { await authService.logout(); } catch (e) { console.error(e); } finally { contextLogout(); navigate('/login'); }
    };

    // --- RENDER LOGIC ---

    if (isLoading) { /* Loading state JSX */
      return (<div className="dashboard-container"><div className="loading-container"><p>Loading...</p></div></div>);
    }
    if (error) { /* Error state JSX */
      return (<div className="dashboard-container"><div className="error-container"><p>⚠️ Error: {error}</p></div></div>);
    }

    return (
        <div className="dashboard-container">
            <h2 className="welcome-heading">
                Welcome, {profileData?.full_name || user?.email || 'User'}!
            </h2>
            <button onClick={handleLogout} className="logout-button">Logout</button>

            {/* Container for Profile & Account Cards */}
            <div className="dashboard-content-layout">
                {/* Profile Card */}
                <section className="card profile-card">
                    <h3>Profile Information</h3>
                    {profileData ? (
                        <dl>
                            <dt>Full Name:</dt><dd>{profileData.full_name || 'N/A'}</dd>
                            <dt>Email:</dt><dd>{profileData.email_address || 'N/A'}</dd>
                            <dt>Customer ID:</dt><dd>{profileData.customer_id || 'N/A'}</dd>
                            <dt>Phone:</dt><dd>{profileData.phone_number || 'N/P'}</dd>
                            <dt>Address:</dt><dd>{profileData.address || 'N/P'}</dd>
                        </dl>
                    ) : <p>Profile data unavailable.</p>}
                </section>

                {/* Account Card */}
                <section className="card account-card">
                    <h3>Account Details</h3>
                    {accountData ? (
                        <>
                            <dl>
                                <dt>Account #:</dt><dd>{accountData.account_number || 'N/A'}</dd>
                                <dt>Balance:</dt><dd>{formatCurrency(accountData.account_balance)}</dd>
                                {accountData.updated_at !== accountData.created_at && (
                                    <>
                                        <dt>Last Updated:</dt><dd>{formatDate(accountData.updated_at)}</dd>
                                    </>
                                )}
                            </dl>
                            {/* --- Updated Button onClick --- */}
                            <button
                                className="transactions-button"
                                // Toggle visibility: show if hidden, hide if shown
                                onClick={() => setShowTransactions(!showTransactions)}
                            >
                                {showTransactions ? 'Hide Transactions' : 'View Transactions'}
                            </button>
                        </>
                    ) : <p>Account data unavailable.</p>}
                </section>
            </div> {/* End dashboard-content-layout */}


            {/* --- NEW: Conditional Transaction Card --- */}
            {/* Show only if showTransactions is true AND accountData exists */}
            {showTransactions && accountData && (
                <section className="card transactions-card"> {/* Use card style + specific class */}
                    <h3>
                        Recent Transactions ({accountData.account_number})
                        {/* Simple close button */}
                        <button
                            onClick={() => setShowTransactions(false)}
                            className="close-button"
                            title="Close Transactions"
                        >
                            &times; {/* HTML entity for 'X' symbol */}
                        </button>
                    </h3>

                    {/* Check if transactions array exists and has items */}
                    {accountData.transactions && accountData.transactions.length > 0 ? (
                        <div className="table-responsive"> {/* Wrapper for scrolling on small screens */}
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Balance After</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map over the transactions */}
                                    {accountData.transactions.map((t) => {
                                        // Calculate amount change for display
                                        const amountChange = t.amount_after - t.amount_before;
                                        // Determine class for styling credit/debit
                                        const amountStyle = amountChange >= 0 ? 'positive-amount' : 'negative-amount';
                                        return (
                                            // Use transaction_number as key
                                            <tr key={t.transaction_number}>
                                                <td>{formatDate(t.timestamp)}</td>
                                                <td>{t.type}</td>
                                                <td>{t.description}</td>
                                                <td className={amountStyle}>{formatCurrency(amountChange)}</td>
                                                <td>{formatCurrency(t.amount_after)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>No recent transactions found for this account.</p>
                    )}
                </section>
            )}
            {/* --- End Conditional Transaction Card --- */}

        </div> // End dashboard-container
    );
}

export default DashboardPage;
