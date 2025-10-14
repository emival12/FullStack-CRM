import "./LoadingScreen.css";
import Spinner from "react-bootstrap/Spinner";

export default function LoadingScreen() {
  return (
    <div className="LoadingPage">
      <Spinner animation="border" variant="light" />
      <p className="LoadingPage-text">Caricamento...</p>
    </div>
  );
}
