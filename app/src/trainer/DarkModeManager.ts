export class DarkModeManager {
    constructor() {
        this.syncBodyClass();
    }

    public isDarkMode() {
        return !!window.localStorage.getItem('darkMode');
    }

    public setDarkMode(isDark: boolean) {
        if (!isDark) {
            window.localStorage.setItem('darkMode', '');
        } else {
            window.localStorage.setItem('darkMode', 'true');
        }
        this.syncBodyClass();
    }

    private syncBodyClass() {
        document.getElementsByTagName('body')[0].className =  this.isDarkMode() ? 'dark' : '';
    }
}