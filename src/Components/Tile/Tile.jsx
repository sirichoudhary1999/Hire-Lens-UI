import "./Tile.css";

const Tile = ({ title, description, icon, onClick }) => {
  return (
    <div className="tile" onClick={onClick}>
      <div className="tile-icon">{icon}</div>
      <h3 className="tile-title">{title}</h3>
      <p className="tile-description">{description}</p>
    </div>
  );
};

export default Tile;
