import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import gsap from 'gsap';
import { SmoothieChart, TimeSeries } from 'smoothie';

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for theme to be initially set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Boot Sequence
    const bootScreen = document.getElementById('boot_screen');
    const bootLogs = document.getElementById('boot_logs');

    const messages = [
        "Initializing core systems...",
        "Loading UI modules...",
        "Connecting to virtual display...",
        "Establishing network interfaces...",
        "Boot sequence complete."
    ];

    for (let msg of messages) {
        bootLogs.innerHTML += `<div>> ${msg}</div>`;
        await new Promise(r => setTimeout(r, 400));
    }

    gsap.to(bootScreen, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            bootScreen.style.display = 'none';
            bootScreen.style.pointerEvents = 'none';
            initUI();
        }
    });

    function initUI() {
        // Init Terminal
        const termContainer = document.getElementById('terminal_container');
        const term = new Terminal({
            fontFamily: 'Fira Mono',
            fontSize: 14,
            cursorBlink: true,
            theme: getTermTheme()
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(termContainer);
        fitAddon.fit();

        term.writeln('\x1b[1;32mWelcome to eDEX-UI (Web Clone)\x1b[0m');
        term.writeln('Type "help" to see available commands.');
        term.write('\r\n$ ');

        let currentInput = '';
        term.onData(e => {
            switch (e) {
                case '\r': // Enter
                    term.writeln('');
                    if (currentInput.trim() === 'help') {
                        term.writeln('Available commands: help, clear, whoami, date, echo');
                    } else if (currentInput.trim() === 'clear') {
                        term.clear();
                    } else if (currentInput.trim() === 'whoami') {
                        term.writeln('guest_user');
                    } else if (currentInput.trim() === 'date') {
                        term.writeln(new Date().toString());
                    } else if (currentInput.startsWith('echo ')) {
                        term.writeln(currentInput.substring(5));
                    } else if (currentInput.trim().length > 0) {
                        term.writeln(`Command not found: ${currentInput}`);
                    }
                    currentInput = '';
                    term.write('$ ');
                    break;
                case '\u007F': // Backspace (DEL)
                    // Do not delete the prompt
                    if (currentInput.length > 0) {
                        currentInput = currentInput.substr(0, currentInput.length - 1);
                        term.write('\b \b');
                    }
                    break;
                default:
                    if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                        currentInput += e;
                        term.write(e);
                    }
            }
        });

        window.addEventListener('resize', () => {
            fitAddon.fit();
        });

        document.addEventListener('theme-changed', () => {
            term.options.theme = getTermTheme();
        });

        // Initialize Monitors
        initMonitors();

        // Initialize Clock
        initClock();

        // Animate main UI entrance
        // Explicitly set opacity to 1 before animating from 0
        gsap.set(["#mod_column_left", "#mod_column_right", "#main_shell", "#filesystem", "#keyboard"], { opacity: 1 });
        gsap.from("#mod_column_left", { x: -50, opacity: 0, duration: 1, ease: "power2.out" });
        gsap.from("#mod_column_right", { x: 50, opacity: 0, duration: 1, ease: "power2.out" });
        gsap.from("#main_shell", { scale: 0.9, opacity: 0, duration: 1, ease: "power2.out", delay: 0.2 });
        gsap.from("#filesystem", { y: 50, opacity: 0, duration: 1, ease: "power2.out", delay: 0.4 });
        gsap.from("#keyboard", { y: 50, opacity: 0, duration: 1, ease: "power2.out", delay: 0.4 });
    }

    function getTermTheme() {
        const theme = window.currentTheme;
        if (!theme) return {};
        return {
            foreground: theme.terminal.foreground || `rgb(${theme.colors.r}, ${theme.colors.g}, ${theme.colors.b})`,
            background: theme.terminal.background || '#000000',
            cursor: theme.terminal.cursor || `rgb(${theme.colors.r}, ${theme.colors.g}, ${theme.colors.b})`,
            selection: theme.terminal.selection || `rgba(${theme.colors.r}, ${theme.colors.g}, ${theme.colors.b}, 0.3)`
        };
    }

    function initMonitors() {
        // CPU Chart
        const cpuChart = new SmoothieChart({
            grid: { strokeStyle: 'rgba(255,255,255,0.1)', fillStyle: 'transparent', lineWidth: 1, millisPerLine: 1000, verticalSections: 4 },
            labels: { fillStyle: 'transparent' },
            maxValue: 100, minValue: 0
        });
        const cpuSeries = new TimeSeries();
        cpuChart.addTimeSeries(cpuSeries, { strokeStyle: getColor(), lineWidth: 2, fillStyle: getFillColor() });
        cpuChart.streamTo(document.getElementById("cpu_graph"), 1000);

        // RAM Chart
        const ramChart = new SmoothieChart({
            grid: { strokeStyle: 'rgba(255,255,255,0.1)', fillStyle: 'transparent', lineWidth: 1, millisPerLine: 1000, verticalSections: 4 },
            labels: { fillStyle: 'transparent' },
            maxValue: 100, minValue: 0
        });
        const ramSeries = new TimeSeries();
        ramChart.addTimeSeries(ramSeries, { strokeStyle: getColor(), lineWidth: 2, fillStyle: getFillColor() });
        ramChart.streamTo(document.getElementById("ram_graph"), 1000);

        setInterval(() => {
            const time = new Date().getTime();
            const cpuVal = Math.random() * 40 + 10; // Mock CPU 10-50%
            cpuSeries.append(time, cpuVal);
            document.getElementById('cpu_percent').innerText = `${cpuVal.toFixed(1)}%`;

            const ramVal = Math.random() * 20 + 40; // Mock RAM 40-60%
            ramSeries.append(time, ramVal);
            document.getElementById('ram_percent').innerText = `${ramVal.toFixed(1)}% / 8GB`;

            // Mock Network
            document.getElementById('net_rx').innerText = Math.floor(Math.random() * 1000);
            document.getElementById('net_tx').innerText = Math.floor(Math.random() * 500);
            document.getElementById('ping_val').innerText = `${Math.floor(Math.random() * 20 + 10)}ms`;
        }, 1000);

        document.addEventListener('theme-changed', () => {
            cpuChart.seriesSet[0].options.strokeStyle = getColor();
            cpuChart.seriesSet[0].options.fillStyle = getFillColor();
            ramChart.seriesSet[0].options.strokeStyle = getColor();
            ramChart.seriesSet[0].options.fillStyle = getFillColor();
        });
    }

    function getColor() {
        const theme = window.currentTheme;
        if (!theme) return 'rgb(0, 255, 0)';
        return `rgb(${theme.colors.r}, ${theme.colors.g}, ${theme.colors.b})`;
    }

    function getFillColor() {
        const theme = window.currentTheme;
        if (!theme) return 'rgba(0, 255, 0, 0.2)';
        return `rgba(${theme.colors.r}, ${theme.colors.g}, ${theme.colors.b}, 0.2)`;
    }

    function initClock() {
        const timeEl = document.getElementById('clock_time');
        const dateEl = document.getElementById('clock_date');
        const uptimeEl = document.getElementById('uptime');
        let startTime = Date.now();

        setInterval(() => {
            const now = new Date();
            timeEl.innerText = now.toLocaleTimeString('en-US', { hour12: false });
            dateEl.innerText = now.toISOString().split('T')[0];

            const diff = Math.floor((Date.now() - startTime) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            uptimeEl.innerText = `${h}:${m}:${s}`;
        }, 1000);
    }

    // Virtual Keyboard logic
    document.querySelectorAll('.k_key').forEach(key => {
        key.addEventListener('mousedown', () => {
            key.classList.add('active');
            // Mock sending key to terminal
            const char = key.innerText;
            // if real terminal, we could trigger it here.
        });
        key.addEventListener('mouseup', () => {
            key.classList.remove('active');
        });
        key.addEventListener('mouseleave', () => {
            key.classList.remove('active');
        });
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            key.classList.add('active');
        });
        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            key.classList.remove('active');
        });
    });
});
