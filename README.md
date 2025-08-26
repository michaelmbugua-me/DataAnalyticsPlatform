# Data Analytics Platform

[![Coverage Status](https://coveralls.io/repos/github/michaelmbugua-me/DataAnalyticsPlatform/badge.svg?branch=main)](https://coveralls.io/github/michaelmbugua-me/DataAnalyticsPlatform?branch=main)

A modern Angular-based data analytics platform designed for exploring, filtering, and visualizing medium to large datasets with exceptional performance and user experience.

## Features

### Data Exploration
- **Dataset Management**: Load and browse large datasets with intuitive interface
- **Advanced Filtering**: Multi-criteria filtering with complex conditions
- **Saved Filters**: Store and quickly access frequently used filter configurations
- **Global Search**: Text-based search across entire datasets

### Data Analysis
- **Grouping & Aggregation**: Summarize data to identify patterns and trends
- **Pivot Table Creation**: Analyze data from multiple perspectives
- **Calculated Aggregates**: Automatic computation of statistics and distributions
- **Custom Query Building**: Create specific data views with advanced query tools

### Data Visualization
- **Interactive Charts**: Multiple chart types for trend visualization
- **High-Performance Rendering**: Efficient chart loading without workflow interruption
- **Real-time Feedback**: Clear loading states and error notifications
- **Export Capabilities**: Share visualizations in multiple formats

### User Experience
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Collaboration Tools**: Share analysis views with team members
- **Work Caching**: Automatic saving of recent work for efficiency
- **Intuitive Interface**: User-friendly navigation and interactions

## Technical Stack

- **Framework**: Angular 20 (Standalone Components)
- **Styling**: Sass with PrimeNG UI Component Library
- **State Management**: Angular Signals + RxJS
- **Testing**: Jest with comprehensive unit test coverage
- **Build Tool**: Angular CLI with optimized production builds

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core services and interceptors
│   ├── features/            # Feature modules
│   │   ├── dashboard/       # Dashboard components
│   │   ├── data-explorer/   # Data exploration tools
│   │   ├── analysis/        # Analysis components
│   │   ├── visualization/   # Charting components
│   │   └── shared/          # Shared utilities
│   ├── models/              # TypeScript interfaces and types
│   ├── services/            # Business logic and data services
│   └── utils/               # Utility functions and helpers
├── assets/
│   ├── data/               # Mock datasets
│   └── styles/             # Global styles and themes
└── environments/           # Environment configurations
```

## Getting Started

### Prerequisites
- Node.js 22.18.0
- npm 10.9.3
- Angular CLI 20.2.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd data-analytics-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Building for Production

```bash
# Development build
ng build

# Production build with optimization
ng build --configuration production
```

### Running Tests

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```
