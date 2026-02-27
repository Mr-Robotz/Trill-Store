import Footer from "./components/Footer";
import Header from "./components/Header";

const provider = ({ children }) => {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
};
export default provider;
