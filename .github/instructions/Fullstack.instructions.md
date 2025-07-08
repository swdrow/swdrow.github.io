---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.
---
# Fullstack Development Instructions
## General Guidelines
- Whenever making updates to the website, utilize the analyze-website.js analyzer to check for issues through puppeteer.
- Ensure that all changes are compatible with the existing codebase and do not introduce breaking changes.
- Write clean, maintainable, and well-documented code.
- Follow best practices for both frontend and backend development.
- Ensure code is modular and reusable.
- Use version control effectively (e.g., Git).
- Write unit tests for critical components.
- Servers used should be both frontend and backend hosted on port 5000 on gunicorn server(with start-prod.sh) for production.
- When developing, all changes made to the api should be made to the main api server running on port 5000, do not make new instances.
- When testing the fronted, use the api server running on port 5000 for api access, and do not create new instances, run the preview server for the webpage on port 3000.
- If there is ever a conflict when you attempt to run something on a port, do not create a new instance, instead, stop the existing process using that port.
- After every change, ensure that no functionality is broken and that the application runs smoothly.
- The website is hosted by cloudflare through github pages, so ensure that any changes made to the website are compatible with cloudflare's requirements, as well as the requirements of github pages, and the gunicorn and redis servers.
## Security
- Sanitize and validate all user inputs to prevent XSS and SQL injection attacks.
- Use HTTPS for all communications.
- Use environment variables for sensitive information (e.g., API keys, database credentials).
- Ensure that the code is compatible with the latest stable versions of libraries and frameworks.
## Coding Standards
- Use consistent naming conventions (camelCase for variables and functions, PascalCase for classes).
- Use indentation and spacing consistently (2 spaces for JavaScript, 4 spaces for Python).
- Use semicolons at the end of statements in JavaScript.
- Keep the codebase clean and organized, with a clear directory structure.
## Code Quality
- Use linters and formatters (e.g., ESLint, Prettier) to maintain code quality.
- Write meaningful commit messages.
- Use code reviews to ensure quality and share knowledge.
- Document code with comments and README files.
## Frontend Development
- Use modern frameworks (e.g., React, Vue, Angular).
- Ensure responsive design and cross-browser compatibility.
- Optimize for performance and accessibility.
- Use state management libraries (e.g., Redux, Vuex) where appropriate.
- Follow a consistent styling approach (e.g., CSS-in-JS, SASS).
- The design for the website is intended to be simple, dark mode, with a focus on usability and feature richness.
- Design for the website should be based on the liquid glass design by Apple in iOS 26. All features should be designed with this in mind, and the design should be simple, dark mode, and focus on usability and feature richness. 
- The website should be designed to be responsive and work well on both desktop and mobile devices.
- All data fields, formatting, and other design elements should be consistent with the liquid glass design and should be thoroughly tested to ensure that they work well on both desktop and mobile devices as well as correctly populate values and correspond to the data in the database.
- Utilize tailwindcss for styling, ensuring that the design is consistent with the liquid glass design and is responsive across devices.
- The design should be dark mode with the liquid glass design in mind, with a focus on usability and feature richness.
- Ensure that the design is visually appealing and consistent with the liquid glass design, with a focus
### 🔷 Liquid Glass Visual Effects
- **Translucent glass panels** with multi-layer gradients
- **Subtle light reflections** using CSS gradients and inset shadows  
- **Backdrop blur effects** with proper saturation
- **Inner glow highlights** on panel edges
- **Dark theme compatibility** with appropriate opacity levels
- **Smooth hover transitions** with enhanced glass reflections

### 🔷 TailwindCSS Implementation
- **Full TailwindCSS integration** as specified in Fullstack instructions
- **Custom Tailwind configuration** for glass colors and animations
- **Responsive design** across all device sizes
- **Dark gradient backgrounds** with animated movement
- **Custom glass effect classes** for consistent styling

### 🔷 Advanced UI Components
- **Navigation with glass blur** and dark transparency
- **Interactive glass panels** with hover animations
- **Loading screens** with glass effects
- **Error notifications** using glass styling
- **Charts and data visualizations** with glass containers
- **Wind compass** with glass design elements
### ✅ Enhanced Dashboard Features
1. **Water Conditions Panel**
   - Real-time water temperature, gauge height, and flow rate
   - Water level status indicators (Low/Normal/Good/High)
   - Flow status assessment with color coding
   - Contextual advice based on water conditions

2. **Performance Insights**
   - Wind trend analysis and predictions
   - Optimal rowing time recommendations
   - Weather risk assessment with alerts
   - AI-powered condition analysis

3. **Advanced Analytics**
   - 24-hour forecast charts with multiple data series
   - Wind direction compass with visual indicators
   - RowCast score trending and analysis
   - Extended forecast with daily summaries

### ✅ Enhanced Weather Page
1. **Detailed Forecast Timeline**
   - 12-hour hourly forecast with weather icons
   - Temperature, wind, and score for each hour
   - Precipitation indicators
   - Interactive forecast cards

2. **Extended Forecast View**
   - 4-day weather outlook
   - Daily high/low temperatures
   - Average wind speeds and conditions
   - Daily RowCast score averages

3. **Weather Details Grid**
   - Current conditions with multiple metrics
   - UV index, visibility, precipitation
   - Wind speed and direction
   - Feels-like temperature

### ✅ Interactive API Documentation
- Clickable endpoint testing
- Live API response previews
- Error handling and status display
- Real-time API status monitoring

### ✅ Liquid Glass Design Improvements
- Enhanced glass effects and animations
- Smooth transitions and hover effects
- Gradient backgrounds and visual polish
- Mobile-responsive design
- Dark mode optimized

### ✅ Real-time Features
- Live status indicator
- Automatic data refresh
- Connection status monitoring
- Last updated timestamps

### Performance Optimizations
- Chart.js integration with error handling
- Defensive programming for missing data
- Smooth animations and transitions
- Efficient data updates

### Feature Richness
- Multiple weather metrics and analysis
- Advanced rowing condition insights
- Comprehensive forecast views
- Interactive elements throughout