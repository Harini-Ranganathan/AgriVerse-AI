
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import FarmAIAssistantPage from "./pages/FarmAIAssistantPage";
import DiseaseDetectionPage from "./pages/DiseaseDetectionPage";
import AddLandPage from "./pages/AddLandPage";
import LandDetailsPage from "./pages/LandDetailsPage";
import SellProductsPage from "./pages/SellProductsPage";
import AddProductPage from "./pages/AddProductPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import LandMarketplacePage from "./pages/LandMarketplacePage";
import MarketplaceLandDetailsPage from "./pages/MarketplaceLandDetailsPage";
import SellLandPage from "./pages/SellLandPage";
import WeatherPage from "./pages/WeatherPage";
import FarmerNetworkPage from "./pages/FarmerNetworkPage";
import FarmerDiscussionPage from "./pages/FarmerDiscussionPage";
import MarketPricePage from "./pages/MarketPricePage";
import RentalEquipmentsPage from "./pages/RentalEquipmentPage";
import AddRentalEquipmentPage from "./pages/AddRentalEquipmentPage";
import RentalEquipmentDetailsPage from "./pages/RentalEquipmentDetailsPage";
import RentalOrdersPage from "./pages/RentalOrdersPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import LandRequestsPage from "./pages/LandRequestsPage";
import MyProductOrdersPage from "./pages/MyProductOrdersPage";
import AdminDashboard from "./pages/AdminDashboard";
import HelpSupportPage from "./pages/HelpSupportPage";


const FARMER_ROLES = ["farmer"];
const BUYER_ROLES = ["buyer"];
const USER_ROLES = ["farmer", "buyer"];

function protect(Component, allowedRoles = USER_ROLES) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/farmer-dashboard"
        element={protect(FarmerDashboard, FARMER_ROLES)}
      />

      <Route
        path="/customer-dashboard"
        element={protect(CustomerDashboard, BUYER_ROLES)}
      />

      <Route
        path="/farm-ai-assistant"
        element={protect(FarmAIAssistantPage)}
      />

      <Route
        path="/disease-detection"
        element={protect(DiseaseDetectionPage)}
      />

      <Route
        path="/add-land"
        element={protect(AddLandPage, FARMER_ROLES)}
      />

      <Route
        path="/land/:id"
        element={protect(LandDetailsPage, FARMER_ROLES)}
      />

      <Route
        path="/sell-products"
        element={protect(SellProductsPage, USER_ROLES)}
      />

      <Route
        path="/add-product"
        element={protect(AddProductPage, USER_ROLES)}
      />

      <Route
        path="/edit-product/:id"
        element={protect(AddProductPage, USER_ROLES)}
      />

      <Route
        path="/product/:id"
        element={protect(ProductDetailsPage, USER_ROLES)}
      />

      <Route
        path="/land-marketplace"
        element={protect(LandMarketplacePage, USER_ROLES)}
      />

      <Route
        path="/marketplace-land/:landId"
        element={protect(MarketplaceLandDetailsPage, USER_ROLES)}
      />

      <Route
        path="/sell-land"
        element={protect(SellLandPage, ["farmer", "buyer"])}
      />

      <Route
        path="/sell-land/edit/:landId"
        element={protect(SellLandPage, ["farmer", "buyer"])}
      />

      <Route
        path="/weather"
        element={protect(WeatherPage, USER_ROLES)}
      />

      <Route
        path="/farmer-network"
        element={protect(FarmerNetworkPage, USER_ROLES)}
      />

      <Route
        path="/farmer-network/:id"
        element={protect(FarmerDiscussionPage, USER_ROLES)}
      />

      <Route
        path="/market-price"
        element={protect(MarketPricePage, USER_ROLES)}
      />

      <Route
        path="/equipment-rental"
        element={protect(RentalEquipmentsPage, USER_ROLES)}
      />

      <Route
        path="/add-rental-equipment"
        element={protect(AddRentalEquipmentPage, USER_ROLES)}
      />

      <Route
        path="/edit-rental-equipment/:equipmentId"
        element={protect(AddRentalEquipmentPage, USER_ROLES)}
      />

      <Route
        path="/rental-equipment/:equipmentId"
        element={protect(RentalEquipmentDetailsPage, USER_ROLES)}
      />

      <Route
        path="/rental-orders"
        element={protect(RentalOrdersPage, USER_ROLES)}
      />

      <Route
        path="/my-requests"
        element={protect(MyRequestsPage, BUYER_ROLES)}
      />

      <Route
        path="/order-tracking"
        element={protect(OrderTrackingPage, USER_ROLES)}
      />

      <Route
  path="/land-requests"
  element={protect(LandRequestsPage, ["farmer", "buyer"])}
/>

<Route
  path="/my-product-orders"
  element={protect(MyProductOrdersPage, ["farmer", "buyer"])}
/>

<Route
  path="/admin-dashboard"
  element={protect(AdminDashboard, ["admin"])}
/>

<Route
  path="/help-support"
  element={protect(HelpSupportPage, USER_ROLES)}
/>




    </Routes>
  );
}

export default App;
