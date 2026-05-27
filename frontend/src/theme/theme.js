import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },

    secondary: {
      main: '#2e7d32',
    },

    background: {
      default: '#f4f6f8',
    },
  },

  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

export default theme;