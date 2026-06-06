(function () {
  'use strict';

  /* ===== STORAGE KEYS ===== */
  const KEYS = {
    EXPENSES: 'sw_expenses',
    PROFILE: 'sw_profile',
    SETTINGS: 'sw_settings',
  };

  /* ===== STATE ===== */
  let expenses = [];
  let profile = null; // { name, email, password, budget }
  let settings = { darkMode: false, budgetAlerts: true };

  /* ===== DOM CACHE ===== */
  const $ = (id) => document.getElementById(id);

  // Screens
  const screenHome = $('screen-home');
  const screenSignin = $('screen-signin');
  const screenSignup = $('screen-signup');
  const screenDashboard = $('screen-dashboard');
  const screenSettings = $('screen-settings');

  // Home
  const homeLoginBtn = $('home-login-btn');
  const homeSignupBtn = $('home-signup-btn');

  // Sign In form
  const signinForm = $('signin-form');
  const signinEmail = $('signin-email');
  const signinPassword = $('signin-password');
  const gotoSignup = $('goto-signup');

  // Sign Up form
  const signupForm = $('signup-form');
  const signupName = $('signup-name');
  const signupEmail = $('signup-email');
  const signupPassword = $('signup-password');
  const signupBudget = $('signup-budget');
  const gotoSignin = $('goto-signin');

  // Dashboard
  const avatarInitials = $('avatar-initials');
  const displayName = $('display-name');
  const displayEmail = $('display-email');
  const settingsBtn = $('settings-btn');
  const totalDisplay = $('total-display');
  const budgetLeft = $('budget-left');
  const savingsDisplay = $('savings-display');
  const budgetBarWrap = $('budget-bar-wrap');
  const budgetPercent = $('budget-percent');
  const budgetBarFill = $('budget-bar-fill');
  const savingsBarWrap = $('savings-bar-wrap');
  const savingsPercent = $('savings-percent');
  const savingsBarFill = $('savings-bar-fill');
  const expenseNameInput = $('expense-name');
  const expenseAmountInput = $('expense-amount');
  const addBtn = $('add-btn');
  const expenseList = $('expense-list');
  const emptyState = $('empty-state');
  const clearAllBtn = $('clear-all-btn');

  // AI Insights
  const aiSection = $('ai-section');
  const aiContent = $('ai-content');
  const aiAnalyzeBtn = $('ai-analyze-btn');

  // Settings
  const settingsBackBtn = $('settings-back-btn');
  const settingsName = $('settings-name');
  const settingsEmail = $('settings-email');
  const settingsBudget = $('settings-budget');
  const settingsSavingsGoal = $('settings-savings-goal');
  const toggleDark = $('toggle-dark');
  const toggleAlerts = $('toggle-alerts');
  const saveSettingsBtn = $('save-settings-btn');
  const exportBtn = $('export-btn');
  const clearDataBtn = $('clear-data-btn');
  const logoutBtn = $('logout-btn');

  /* ===== HELPERS ===== */

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function formatNaira(amount) {
    return '₦' + amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatTime(timestamp) {
    var d = new Date(timestamp);
    var now = new Date();
    var diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    if (!name) return '??';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function showToast(message, type) {
    type = type || 'success';
    var container = $('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast' + (type !== 'success' ? ' ' + type : '');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  }

  /* ===== DATA PERSISTENCE ===== */

  function loadAll() {
    try {
      var raw = localStorage.getItem(KEYS.EXPENSES);
      expenses = raw ? JSON.parse(raw) : [];
    } catch (e) {
      expenses = [];
    }

    try {
      var p = localStorage.getItem(KEYS.PROFILE);
      profile = p ? JSON.parse(p) : null;
    } catch (e) {
      profile = null;
    }

    try {
      var s = localStorage.getItem(KEYS.SETTINGS);
      if (s) {
        var parsed = JSON.parse(s);
        settings.darkMode = !!parsed.darkMode;
        settings.budgetAlerts = parsed.budgetAlerts !== false;
      }
    } catch (e) { /* defaults */ }
  }

  function saveExpenses() {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  }

  function saveProfile() {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }

  function saveSettings() {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }

  function migrateLegacyData() {
    var oldMap = {
      EXPENSES: 'et_expenses',
      PROFILE: 'et_profile',
      SETTINGS: 'et_settings',
    };
    var migrated = false;
    Object.keys(oldMap).forEach(function (key) {
      var oldVal = localStorage.getItem(oldMap[key]);
      if (oldVal !== null) {
        localStorage.setItem(KEYS[key], oldVal);
        localStorage.removeItem(oldMap[key]);
        migrated = true;
      }
    });
    if (migrated) {
      console.log('SpendWise: migrated data from legacy storage keys.');
    }
  }

  /* ===== SCREEN NAVIGATION ===== */

  function showScreen(screen) {
    [screenHome, screenSignin, screenSignup, screenDashboard, screenSettings].forEach(function (s) {
      s.classList.remove('active');
    });
    requestAnimationFrame(function () {
      screen.classList.add('active');
    });
  }

  /* ===== DARK MODE ===== */

  function applyDarkMode(on) {
    if (on) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    toggleDark.checked = on;
  }

  /* ===== SIGN IN ===== */

  function handleSignIn(e) {
    e.preventDefault();

    var email = signinEmail.value.trim();
    var password = signinPassword.value;

    if (!email) { showToast('Please enter your email', 'error'); return; }
    if (!password) { showToast('Please enter your password', 'error'); return; }

    var stored = localStorage.getItem(KEYS.PROFILE);
    if (!stored) {
      signinPassword.value = '';
      showToast('No account found. Please sign up first.', 'error');
      return;
    }

    var storedProfile;
    try { storedProfile = JSON.parse(stored); } catch (e) { storedProfile = null; }

    if (!storedProfile || storedProfile.email !== email) {
      signinPassword.value = '';
      showToast('Invalid email or password.', 'error');
      return;
    }

    if (storedProfile.password && storedProfile.password !== password) {
      signinPassword.value = '';
      showToast('Invalid email or password.', 'error');
      return;
    }

    profile = storedProfile;
    saveProfile();

    updateDashboardProfile();
    renderExpenses();
    showScreen(screenDashboard);
    showToast('Welcome back, ' + profile.name.split(' ')[0] + '! 👋');
  }

  /* ===== SIGN UP ===== */

  function handleSignUp(e) {
    e.preventDefault();

    var name = signupName.value.trim();
    var email = signupEmail.value.trim();
    var password = signupPassword.value;
    var budget = parseFloat(signupBudget.value) || 0;

    if (!name) { showToast('Please enter your full name', 'error'); return; }
    if (!email) { showToast('Please enter your email', 'error'); return; }
    if (!password || password.length < 4) { showToast('Password must be at least 4 characters', 'error'); return; }

    var existing = localStorage.getItem(KEYS.PROFILE);
    if (existing) {
      var existingProfile;
      try { existingProfile = JSON.parse(existing); } catch (e) { existingProfile = null; }
      if (existingProfile && existingProfile.email === email) {
        showToast('An account with this email already exists.', 'error');
        return;
      }
    }

    profile = { name: name, email: email, password: password, budget: budget, savingsGoal: 0 };
    saveProfile();

    updateDashboardProfile();
    renderExpenses();
    showScreen(screenDashboard);
    showToast('Welcome to SpendWise, ' + name.split(' ')[0] + '! 🎉');
  }

  /* ===== DASHBOARD PROFILE ===== */

  function updateDashboardProfile() {
    if (!profile) return;
    avatarInitials.textContent = getInitials(profile.name);
    displayName.textContent = profile.name;
    displayEmail.textContent = profile.email;
  }

  /* ===== EXPENSE LOGIC ===== */

  function getTotal() {
    return expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
  }

  function renderExpenses() {
    var total = getTotal();
    totalDisplay.textContent = formatNaira(total);

    // Budget
    var budget = (profile && profile.budget) ? profile.budget : 0;
    var savingsGoal = (profile && profile.savingsGoal) ? profile.savingsGoal : 0;

    if (budget > 0) {
      budgetBarWrap.style.display = 'block';
      var left = budget - total;
      budgetLeft.textContent = formatNaira(Math.max(left, 0));

      var pct = Math.min((total / budget) * 100, 100);
      budgetPercent.textContent = Math.round(pct) + '%';
      budgetBarFill.style.width = pct + '%';

      // Color classes
      budgetBarFill.classList.remove('warn', 'danger');
      var budgetCard = document.querySelector('.summary-budget');
      budgetCard.classList.remove('over');

      if (pct >= 100) {
        budgetBarFill.classList.add('danger');
        budgetCard.classList.add('over');
      } else if (pct >= 80) {
        budgetBarFill.classList.add('warn');
        if (settings.budgetAlerts && pct >= 80 && !budgetBarFill.dataset.warned) {
          showToast('⚠️ You\'ve used ' + Math.round(pct) + '% of your budget!', 'warning');
          budgetBarFill.dataset.warned = 'true';
        }
      } else {
        budgetBarFill.dataset.warned = '';
      }

      if (left < 0) {
        budgetLeft.textContent = '-' + formatNaira(Math.abs(left));
      }

      // Savings
      var savings = Math.max(left, 0);
      savingsDisplay.textContent = formatNaira(savings);

      if (savingsGoal > 0) {
        savingsBarWrap.style.display = 'block';
        var sPct = Math.min((savings / savingsGoal) * 100, 100);
        savingsPercent.textContent = Math.round(sPct) + '%';
        savingsBarFill.style.width = sPct + '%';
        savingsBarFill.classList.toggle('complete', sPct >= 100);
      } else {
        savingsBarWrap.style.display = 'none';
      }
    } else {
      budgetBarWrap.style.display = 'none';
      budgetLeft.textContent = '—';
      savingsDisplay.textContent = '—';
      savingsBarWrap.style.display = 'none';
    }

    // List
    if (expenses.length === 0) {
      expenseList.innerHTML = '';
      emptyState.style.display = 'block';
      clearAllBtn.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    clearAllBtn.style.display = 'inline-block';

    // Render newest first for a "recent" feel
    var sorted = expenses.slice().reverse();

    expenseList.innerHTML = sorted.map(function (e, i) {
      return (
        '<div class="expense-item" data-id="' + e.id + '" style="animation-delay:' + (i * 0.04) + 's">' +
          '<div class="expense-info">' +
            '<span class="expense-name-span">' + escapeHTML(e.name) + '</span>' +
            '<span class="expense-meta">' + formatTime(e.createdAt) + '</span>' +
          '</div>' +
          '<div class="expense-right">' +
            '<span class="expense-amount">' + formatNaira(e.amount) + '</span>' +
            '<button class="delete-btn" data-id="' + e.id + '" title="Remove expense" aria-label="Remove ' + escapeHTML(e.name) + '">✕</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Attach delete handlers
    expenseList.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteExpense(btn.dataset.id);
      });
    });

    runAIAnalysis();
    renderAnalytics();
  }

  function addExpense() {
    var name = expenseNameInput.value.trim();
    var amount = parseFloat(expenseAmountInput.value);

    var valid = true;

    if (!name) {
      expenseNameInput.classList.add('error');
      valid = false;
    }
    if (!amount || amount <= 0) {
      expenseAmountInput.classList.add('error');
      valid = false;
    }

    if (!valid) return;

    expenses.push({
      id: generateId(),
      name: name,
      amount: amount,
      createdAt: new Date().toISOString(),
    });

    saveExpenses();
    renderExpenses();

    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    expenseNameInput.focus();

    showToast('Added: ' + name + ' — ' + formatNaira(amount));
  }

  function deleteExpense(id) {
    var removed = expenses.find(function (e) { return e.id === id; });
    expenses = expenses.filter(function (e) { return e.id !== id; });
    saveExpenses();
    renderExpenses();
    if (removed) {
      showToast('Removed: ' + removed.name, 'error');
    }
  }

  function clearAllExpenses() {
    if (!confirm('Remove all expenses? This cannot be undone.')) return;
    expenses = [];
    saveExpenses();
    renderExpenses();
    showToast('All expenses cleared', 'error');
  }

  /* ===== AI BUDGET INSIGHTS ===== */

  function runAIAnalysis() {
    if (expenses.length === 0) {
      aiSection.style.display = 'none';
      return;
    }

    var budget = (profile && profile.budget) ? profile.budget : 0;
    var total = getTotal();
    var advice = [];

    // Category keywords
    var categories = {
      'Food & Drinks': ['food', 'lunch', 'dinner', 'breakfast', 'groceries', 'restaurant', 'eat', 'snack', 'drink', 'water', 'provision'],
      'Transport': ['transport', 'fuel', 'gas', 'taxi', 'bus', 'uber', 'fare', 'petrol', 'diesel', 'trip'],
      'Utilities': ['electricity', 'water bill', 'internet', 'phone', 'data', 'bill', 'utility', 'power', 'light'],
      'Entertainment': ['movie', 'game', 'music', 'fun', 'party', 'cinema', 'subscribe', 'netflix', 'sport'],
      'Shopping': ['clothes', 'shoes', 'shopping', 'bag', 'accessory', 'fashion', 'wear'],
      'Health': ['hospital', 'doctor', 'medicine', 'pharmacy', 'health', 'drug', 'clinic'],
      'Housing': ['rent', 'house', 'accommodation', 'maintenance', 'repair', 'furniture'],
      'Education': ['school', 'book', 'course', 'tuition', 'fee', 'class', 'training']
    };

    var catTotals = {};

    expenses.forEach(function (e) {
      var name = e.name.toLowerCase();
      var categorized = false;
      for (var cat in categories) {
        var keywords = categories[cat];
        for (var k = 0; k < keywords.length; k++) {
          if (name.indexOf(keywords[k]) !== -1) {
            catTotals[cat] = (catTotals[cat] || 0) + e.amount;
            categorized = true;
            break;
          }
        }
        if (categorized) break;
      }
      if (!categorized) {
        catTotals['Other'] = (catTotals['Other'] || 0) + e.amount;
      }
    });

    var sortedCats = Object.keys(catTotals).sort(function (a, b) {
      return catTotals[b] - catTotals[a];
    });

    // Budget-based advice
    if (budget > 0) {
      var pct = (total / budget) * 100;

      if (pct > 100) {
        advice.push({
          text: 'You have exceeded your monthly budget by ' + formatNaira(total - budget) + '. Reduce non-essential spending for the rest of the month.',
          type: 'danger',
          label: 'OVER BUDGET'
        });
      } else if (pct >= 80) {
        advice.push({
          text: 'You have used ' + Math.round(pct) + '% of your budget with time remaining. Tighten up on discretionary spending.',
          type: 'warn',
          label: 'BUDGET WARNING'
        });
      } else if (pct <= 30) {
        advice.push({
          text: 'Only ' + Math.round(pct) + '% of budget used — excellent discipline. Keep this up and you will save significantly.',
          type: 'success',
          label: 'ON TRACK'
        });
      }

      // Daily projection
      var dayOfMonth = new Date().getDate();
      var daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      if (dayOfMonth > 0) {
        var dailyRate = total / dayOfMonth;
        var projected = dailyRate * daysInMonth;
        if (projected > budget && pct < 100) {
          advice.push({
            text: 'At ₦' + Math.round(dailyRate).toLocaleString() + '/day you are on track to exceed your budget by ' + formatNaira(projected - budget) + ' by month end.',
            type: 'warn',
            label: 'PROJECTION'
          });
        } else if (projected <= budget && pct > 30) {
          advice.push({
            text: 'At ₦' + Math.round(dailyRate).toLocaleString() + '/day you are projected to finish the month within budget. Stay consistent!',
            type: 'success',
            label: 'ON TRACK'
          });
        }
      }
    }

    // Savings advice
    var savingsGoal = (profile && profile.savingsGoal) ? profile.savingsGoal : 0;
    if (budget > 0 && savingsGoal > 0) {
      var savings = Math.max(budget - total, 0);
      var sPct = savingsGoal > 0 ? (savings / savingsGoal) * 100 : 0;
      if (sPct >= 100) {
        advice.push({
          text: 'You have reached your savings goal of ' + formatNaira(savingsGoal) + '! You saved ' + formatNaira(savings) + ' this month.',
          type: 'success',
          label: 'SAVINGS GOAL MET 🎯'
        });
      } else if (sPct >= 50) {
        advice.push({
          text: 'You are ' + Math.round(sPct) + '% toward your savings goal of ' + formatNaira(savingsGoal) + '. You have saved ' + formatNaira(savings) + ' so far.',
          type: 'success',
          label: 'SAVINGS ON TRACK'
        });
      } else if (sPct > 0) {
        advice.push({
          text: 'You have saved ' + formatNaira(savings) + ' (' + Math.round(sPct) + '%) of your ' + formatNaira(savingsGoal) + ' savings goal. Try cutting non-essentials to save more.',
          type: 'warn',
          label: 'SAVINGS TARGET'
        });
      }
    } else if (budget > 0 && total < budget) {
      var savings = budget - total;
      advice.push({
        text: 'You are on track to save ' + formatNaira(savings) + ' this month. Set a savings goal in Settings to track progress!',
        type: 'success',
        label: 'POTENTIAL SAVINGS'
      });
    }

    // Category advice
    if (sortedCats.length > 0) {
      var topCat = sortedCats[0];
      var topAmount = catTotals[topCat];
      var topPct = (topAmount / total) * 100;

      if (topPct > 35) {
        advice.push({
          text: topCat + ' is your biggest spend at ' + Math.round(topPct) + '% (₦' + Math.round(topAmount).toLocaleString() + '). Review if there are cheaper alternatives.',
          type: topPct > 60 ? 'danger' : 'warn',
          label: topPct > 60 ? 'MAJITY SPEND' : 'TOP CATEGORY'
        });
      }

      // Under-spent categories
      var lowestCat = sortedCats[sortedCats.length - 1];
      var lowestAmount = catTotals[lowestCat];
      var lowestPct = (lowestAmount / total) * 100;
      if (lowestPct < 5 && sortedCats.length > 2 && lowestCat !== 'Other') {
        advice.push({
          text: 'You spent very little on ' + lowestCat + ' (₦' + Math.round(lowestAmount).toLocaleString() + '). Good budgeting if this is non-essential.',
          type: 'success',
          label: 'SAVING TIP'
        });
      }

      // Average expense insight
      var avg = total / expenses.length;
      advice.push({
        text: 'Average expense: ' + formatNaira(avg) + ' across ' + expenses.length + ' item(s). ' + (avg > 10000 ? 'Try breaking large expenses into smaller, planned purchases.' : 'Your average expense amount looks healthy.'),
        type: avg > 10000 ? 'warn' : 'success',
        label: 'AVERAGE'
      });
    }

    aiContent.innerHTML = advice.map(function (a) {
      return '<div class="ai-advice' + (a.type !== 'success' ? ' ' + a.type : '') + '">' +
        '<span class="advice-label">' + a.label + '</span>' + a.text + '</div>';
    }).join('');

    aiSection.style.display = 'block';
  }

  /* ===== MONTHLY ANALYTICS ===== */

  function renderAnalytics() {
    if (expenses.length === 0) {
      $('analytics-section').style.display = 'none';
      return;
    }

    var months = {};
    expenses.forEach(function (e) {
      var d = new Date(e.createdAt);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (!months[key]) {
        months[key] = {
          label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          total: 0,
          count: 0,
        };
      }
      months[key].total += e.amount;
      months[key].count++;
    });

    var sortedKeys = Object.keys(months).sort().reverse();

    if (sortedKeys.length === 0) {
      $('analytics-section').style.display = 'none';
      return;
    }

    var html = '';
    sortedKeys.forEach(function (key, i) {
      var m = months[key];
      var changeHtml = '';

      if (i < sortedKeys.length - 1) {
        var prevKey = sortedKeys[i + 1];
        var prev = months[prevKey];
        var diff = m.total - prev.total;
        var pct = prev.total > 0 ? Math.round((Math.abs(diff) / prev.total) * 100) : 0;
        var prevShort = prev.label.split(' ')[0];

        if (diff < 0) {
          changeHtml = '<span class="analytics-month-change down">↓ ' + pct + '% vs ' + prevShort + '  ✅</span>';
        } else if (diff > 0) {
          changeHtml = '<span class="analytics-month-change up">↑ ' + pct + '% vs ' + prevShort + '</span>';
        } else {
          changeHtml = '<span class="analytics-month-change" style="color:var(--text-muted)">→ Same as ' + prevShort + '</span>';
        }
      } else {
        changeHtml = '<span class="analytics-month-change" style="color:var(--text-muted)">First month</span>';
      }

      html += '<div class="analytics-month">' +
        '<div class="analytics-month-left">' +
          '<span class="analytics-month-label">' + m.label + '</span>' +
          '<span class="analytics-month-count">' + m.count + ' expense' + (m.count !== 1 ? 's' : '') + '</span>' +
        '</div>' +
        '<div class="analytics-month-right">' +
          '<div class="analytics-month-total">' + formatNaira(m.total) + '</div>' +
          changeHtml +
        '</div>' +
      '</div>';
    });

    $('analytics-content').innerHTML = html;
    $('analytics-section').style.display = 'block';
  }

  /* ===== SETTINGS ===== */

  function openSettings() {
    if (profile) {
      settingsName.value = profile.name || '';
      settingsEmail.value = profile.email || '';
      settingsBudget.value = profile.budget || '';
      settingsSavingsGoal.value = profile.savingsGoal || '';
    }
    toggleDark.checked = settings.darkMode;
    toggleAlerts.checked = settings.budgetAlerts;
    showScreen(screenSettings);
  }

  function saveAllSettings() {
    // Profile updates
    var name = settingsName.value.trim();
    var email = settingsEmail.value.trim();
    var budget = parseFloat(settingsBudget.value) || 0;
    var savingsGoal = parseFloat(settingsSavingsGoal.value) || 0;

    if (name) profile.name = name;
    if (email) profile.email = email;
    profile.budget = budget;
    profile.savingsGoal = savingsGoal;
    saveProfile();

    // App settings
    settings.darkMode = toggleDark.checked;
    settings.budgetAlerts = toggleAlerts.checked;
    saveSettings();

    applyDarkMode(settings.darkMode);
    updateDashboardProfile();
    renderExpenses();
    showScreen(screenDashboard);
    showToast('Settings saved ✓');
  }

  function exportData() {
    var data = {
      profile: profile,
      expenses: expenses,
      exportedAt: new Date().toISOString(),
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'spendwise-export-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported 📥');
  }

  function clearAllData() {
    if (!confirm('This will remove ALL your data including your profile and expenses. Continue?')) return;
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.SETTINGS);
    expenses = [];
    profile = null;
    settings = { darkMode: false, budgetAlerts: true };
    applyDarkMode(false);
    showScreen(screenHome);
    showToast('All data cleared', 'error');
  }

  function logout() {
    showScreen(screenHome);
    showToast('Logged out');
  }

  /* ===== EVENT BINDING ===== */

  function clearAuthForms() {
    signinEmail.value = '';
    signinPassword.value = '';
    signupName.value = '';
    signupEmail.value = '';
    signupPassword.value = '';
    signupBudget.value = '';
  }

  function bindEvents() {
    // Home
    homeLoginBtn.addEventListener('click', function () {
      signinEmail.value = '';
      signinPassword.value = '';
      showScreen(screenSignin);
    });
    homeSignupBtn.addEventListener('click', function () {
      clearAuthForms();
      showScreen(screenSignup);
    });

    // Auth nav
    gotoSignup.addEventListener('click', function () {
      signupName.value = '';
      signupEmail.value = '';
      signupPassword.value = '';
      signupBudget.value = '';
      showScreen(screenSignup);
    });
    gotoSignin.addEventListener('click', function () {
      signinEmail.value = '';
      signinPassword.value = '';
      showScreen(screenSignin);
    });

    // Sign In
    signinForm.addEventListener('submit', handleSignIn);

    // Sign Up
    signupForm.addEventListener('submit', handleSignUp);

    // Dashboard
    settingsBtn.addEventListener('click', openSettings);
    addBtn.addEventListener('click', addExpense);
    clearAllBtn.addEventListener('click', clearAllExpenses);

    expenseNameInput.addEventListener('input', function () {
      expenseNameInput.classList.remove('error');
    });
    expenseAmountInput.addEventListener('input', function () {
      expenseAmountInput.classList.remove('error');
    });

    expenseNameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        expenseAmountInput.focus();
      }
    });
    expenseAmountInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addExpense();
      }
    });

    // Settings
    settingsBackBtn.addEventListener('click', function () {
      showScreen(screenDashboard);
    });
    saveSettingsBtn.addEventListener('click', saveAllSettings);
    exportBtn.addEventListener('click', exportData);
    clearDataBtn.addEventListener('click', clearAllData);
    logoutBtn.addEventListener('click', logout);

    // AI Analyze
    aiAnalyzeBtn.addEventListener('click', runAIAnalysis);

    // Dark mode live toggle
    toggleDark.addEventListener('change', function () {
      settings.darkMode = toggleDark.checked;
      saveSettings();
      applyDarkMode(settings.darkMode);
    });
  }

  /* ===== INIT ===== */

  function init() {
    migrateLegacyData();
    loadAll();
    applyDarkMode(settings.darkMode);
    bindEvents();

    if (profile && profile.name) {
      updateDashboardProfile();
      renderExpenses();
      showScreen(screenDashboard);
    } else {
      showScreen(screenHome);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
