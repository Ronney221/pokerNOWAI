import React, { useMemo } from 'react';

const PlayerFilter = ({ data, selectedPlayers, onSelectedPlayersChange }) => {
  // Get unique players from data
  const players = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const uniquePlayers = new Set(
      data.map(session => session.playerName).filter(Boolean)
    );
    
    return Array.from(uniquePlayers).sort();
  }, [data]);

  const handlePlayerToggle = (player) => {
    if (selectedPlayers.includes(player)) {
      onSelectedPlayersChange(selectedPlayers.filter(p => p !== player));
    } else {
      onSelectedPlayersChange([...selectedPlayers, player]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === players.length) {
      onSelectedPlayersChange([]);
    } else {
      onSelectedPlayersChange([...players]);
    }
  };

  if (players.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        className="btn btn-ghost btn-xs"
        onClick={handleSelectAll}
      >
        {selectedPlayers.length === players.length ? 'Clear' : 'All'}
      </button>
      <div className="flex flex-wrap gap-1">
        {players.map(player => (
          <label
            key={player}
            className={`
              btn btn-xs
              ${selectedPlayers.includes(player) ? 'btn-primary' : 'btn-ghost'}
            `}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={selectedPlayers.includes(player)}
              onChange={() => handlePlayerToggle(player)}
            />
            {player}
          </label>
        ))}
      </div>
    </div>
  );
};

export default PlayerFilter; 