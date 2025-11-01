import React from 'react'
import './TributeLeaderboard.css'

function TributeLeaderboard({ expenses, users = [], leaderboardData = null, showTop = 10 }) {
  // Calculate leaderboard stats (if expenses provided)
  const calculateLeaderboard = () => {
    if (leaderboardData !== null && leaderboardData !== undefined) {
      // Use provided leaderboard data (from API)
      console.log('Using leaderboardData:', leaderboardData) // Debug log
      return Array.isArray(leaderboardData) ? leaderboardData : []
    }
    
    // Calculate from expenses if provided
    if (!expenses || expenses.length === 0) {
      return []
    }
    
    const userStats = {}
    
    expenses.forEach(expense => {
      const userId = expense.userId || 'anonymous'
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          count: 0,
          totalAmount: 0,
          expenses: []
        }
      }
      userStats[userId].count++
      userStats[userId].totalAmount += parseFloat(expense.amount || 0)
      userStats[userId].expenses.push(expense)
    })

    // Get user details (username, email) if available
    const userStatsWithDetails = Object.values(userStats).map(stat => {
      const user = users.find(u => u.id === stat.userId)
      return {
        ...stat,
        username: user?.username || `User ${stat.userId.slice(-6)}`,
        email: user?.email || 'N/A'
      }
    })

    // Sort by total amount (descending)
    return userStatsWithDetails.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  const leaderboard = calculateLeaderboard()
  console.log('Calculated leaderboard:', leaderboard) // Debug log

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  // Debug: Show what we have
  console.log('TributeLeaderboard render - leaderboardData:', leaderboardData);
  console.log('TributeLeaderboard render - calculated leaderboard:', leaderboard);
  console.log('TributeLeaderboard render - leaderboard.length:', leaderboard.length);

  return (
    <div className="tribute-leaderboard">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <p className="leaderboard-subtitle">Top Bijoux Tributes Logged</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="empty-leaderboard">
          <p>No tributes yet. Be the first to contribute! 🎉</p>
          {leaderboardData !== null && leaderboardData !== undefined && (
            <p style={{fontSize: '0.8rem', color: '#888', marginTop: '10px'}}>
              (Debug: Received {Array.isArray(leaderboardData) ? leaderboardData.length : 'invalid'} entries from API)
            </p>
          )}
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.slice(0, showTop).map((user, index) => (
            <div key={user.userId} className="leaderboard-item">
              <div className="rank-badge">
                {getRankEmoji(index + 1)}
              </div>
              <div className="leaderboard-user-info">
                <div className="user-name-row">
                  <span className="username">{user.username}</span>
                  {index < 3 && (
                    <span className="top-contributor">⭐ Top Contributor</span>
                  )}
                </div>
                <div className="user-stats-row">
                  <span className="stat-item">
                    💰 ${user.totalAmount.toFixed(2)} total
                  </span>
                  <span className="stat-item">
                    📝 {user.count} {user.count === 1 ? 'expense' : 'expenses'}
                  </span>
                </div>
              </div>
              <div className="leaderboard-amount">
                ${user.totalAmount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard-footer">
        <p>Showing top {Math.min(showTop, leaderboard.length)} contributors</p>
      </div>
    </div>
  )
}

export default TributeLeaderboard

