import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NewsDetail from './components/public/NewsDetail';
import HomePage from './components/public/HomePage';
import NewsByTag from './components/public/NewsByTag';
import Login from './pages/Login';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import UsersManagement from './pages/admin/UsersManagement';
import NewsManagement from './pages/admin/NewsManagement';
import './App.css';

// Privatna ruta 
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div className="loading">Ucitavanje...</div>;
    }
    
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Admin ruta 
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    
    if (loading) {
        return <div className="loading">Ucitavanje...</div>;
    }
    
    return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/cms" />;
};

const CmsDashboard = () => (
    <div className="cms-dashboard">
        <h2>CMS</h2>
        <Outlet />
    </div>
);
const PublicLayout = () => (
    <div>
        <h2>Raf News</h2>
        <Outlet />
    </div>
);

function AppContent() {
    //useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* CMS rute */}
                <Route path="/cms" element={
                    <PrivateRoute>
                        <CmsDashboard />
                    </PrivateRoute>
                }>
                    <Route index element={<Navigate to="/" />} />
                    <Route path="categories" element={
                        <AdminRoute>
                            <CategoriesManagement />
                        </AdminRoute>
                    } />
                    <Route path="news" element={
                        <PrivateRoute>
                            <NewsManagement />
                        </PrivateRoute>
                    } />
                    <Route path="news/new" element={
                        <PrivateRoute>
                            <NewsManagement />
                        </PrivateRoute>
                    } />
                    <Route path="news/:id/edit" element={
                        <PrivateRoute>
                            <NewsManagement />
                        </PrivateRoute>
                    } />
                    <Route path="users" element={
                        <AdminRoute>
                            <UsersManagement />
                        </AdminRoute>
                    } />
                </Route>
                
                {/* Javne rute */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="news/:id" element={<NewsDetail />} /> 
                    <Route path="tags/:id/news" element={<NewsByTag />} />
                </Route>
            </Routes>
            
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;