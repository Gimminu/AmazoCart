/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        amazonNavy: '#131921',
        amazonDark: '#232f3e',
        amazonYellow: '#febd69',
        amazonOrange: '#f08804',
        amazonBlue: '#007185',
        panelGray: '#e3e6e6',
        holidayBurgundy: '#7a1f35',
        holidayGreen: '#49695fff',
        holidaySnow: '#f7f5f2'
      },
      boxShadow: {
        product: '0 1px 3px rgba(0,0,0,0.2)'
      }
    }
  },
  plugins: []
};
