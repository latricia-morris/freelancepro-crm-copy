import Calendar from './pages/Calendar';
import ClientInvoices from './pages/ClientInvoices';
import ClientMessages from './pages/ClientMessages';
import ClientPortal from './pages/ClientPortal';
import ClientProjectDetail from './pages/ClientProjectDetail';
import ClientProjects from './pages/ClientProjects';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Pipeline from './pages/Pipeline';
import Projects from './pages/Projects';
import Prospecting from './pages/Prospecting';
import QuotesInvoices from './pages/QuotesInvoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TimeTracking from './pages/TimeTracking';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "ClientInvoices": ClientInvoices,
    "ClientMessages": ClientMessages,
    "ClientPortal": ClientPortal,
    "ClientProjectDetail": ClientProjectDetail,
    "ClientProjects": ClientProjects,
    "Contacts": Contacts,
    "Dashboard": Dashboard,
    "Expenses": Expenses,
    "Invoices": Invoices,
    "Pipeline": Pipeline,
    "Projects": Projects,
    "Prospecting": Prospecting,
    "QuotesInvoices": QuotesInvoices,
    "Reports": Reports,
    "Settings": Settings,
    "TimeTracking": TimeTracking,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Calendar",
    Pages: PAGES,
    Layout: __Layout,
};