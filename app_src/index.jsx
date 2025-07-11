import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'

import MainComponent from './components/main/main'
import { ContextProvider } from './context'
import HotkeysListner from './hotkeys'

import './index.scss'
import './lib/CSInterface'
import './lib/themeManager'

const App = React.memo(function App() {
	return (
		<ContextProvider>
			<HotkeysListner />
			<MainComponent />
		</ContextProvider>
	)
})

// Replace createRoot(...).render(...) with ReactDOM.render
ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('app')
)
