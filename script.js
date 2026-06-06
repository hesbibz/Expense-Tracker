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
  let selectedMonth = '';

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

  // Month Picker
  const monthPicker = $('month-picker');

  // AI Insights
  const aiSection = $('ai-section');
  const aiContent = $('ai-content');

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

  function getMonthExpenses(monthKey) {
    return expenses.filter(function (e) {
      var d = new Date(e.createdAt);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      return key === monthKey;
    });
  }

  function getCurrentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function renderExpenses() {
    var monthExpenses = selectedMonth ? getMonthExpenses(selectedMonth) : expenses;
    var total = monthExpenses.reduce(function (s, e) { return s + e.amount; }, 0);
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
    if (monthExpenses.length === 0) {
      expenseList.innerHTML = '';
      emptyState.style.display = 'block';
      emptyState.querySelector('p').textContent = expenses.length === 0 ? 'No expenses yet.' : 'No expenses this month.';
      emptyState.querySelector('.empty-hint').textContent = expenses.length === 0 ? 'Add your first expense above to get started!' : 'Try selecting a different month.';
      clearAllBtn.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    emptyState.querySelector('p').textContent = 'No expenses yet.';
    emptyState.querySelector('.empty-hint').textContent = 'Add your first expense above to get started!';
    clearAllBtn.style.display = 'inline-block';

    // Render newest first for a "recent" feel
    var sorted = monthExpenses.slice().reverse();

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

    var currentKey = selectedMonth || getCurrentMonthKey();
    var selYear = parseInt(currentKey.split('-')[0], 10);
    var selMonth = parseInt(currentKey.split('-')[1], 10) - 1;
    var prevDate = new Date(selYear, selMonth - 1, 1);
    var prevKey = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0');

    var now = new Date();
    var currentMonthKey = getCurrentMonthKey();
    var daysInSelMonth = new Date(selYear, selMonth + 1, 0).getDate();
    var dayOfMonth = currentKey === currentMonthKey ? now.getDate() : daysInSelMonth;
    var daysInMonth = daysInSelMonth;

    var monthExp = [];
    var prevMonthExp = [];

    expenses.forEach(function (e) {
      var d = new Date(e.createdAt);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (key === currentKey) monthExp.push(e);
      if (key === prevKey) prevMonthExp.push(e);
    });

    // No data this month
    if (monthExp.length === 0) {
      var anyOld = expenses.length > 0;
      if (anyOld) {
        aiContent.innerHTML = '<div class="ai-advice warn"><span class="advice-label">NO DATA</span>No expenses recorded this month. All your expenses are from previous months — add something this month to get insights!</div>';
      } else {
        aiContent.innerHTML = '<div class="ai-advice"><span class="advice-label">EMPTY</span>No expenses to analyze yet. Start tracking to receive personalized budget insights.</div>';
      }
      aiSection.style.display = 'block';
      return;
    }

    var budget = (profile && profile.budget) ? profile.budget : 0;
    var total = monthExp.reduce(function (s, e) { return s + e.amount; }, 0);
    var count = monthExp.length;
    var dailyRate = dayOfMonth > 0 ? total / dayOfMonth : 0;
    var projected = dailyRate * daysInMonth;
    var advice = [];

    // Previous month comparison
    var prevTotal = prevMonthExp.length > 0 ? prevMonthExp.reduce(function (s, e) { return s + e.amount; }, 0) : 0;
    var prevCount = prevMonthExp.length;

    if (prevTotal > 0) {
      var diff = total - prevTotal;
      var pctChange = Math.round((Math.abs(diff) / prevTotal) * 100);
      if (diff < 0) {
        advice.push({
          text: 'Spending dropped ' + pctChange + '% vs last month (₦' + Math.round(Math.abs(diff)).toLocaleString() + ' less). Good progress!',
          type: 'success',
          label: 'SPENDING DOWN'
        });
      } else if (diff > 0) {
        advice.push({
          text: 'Spending rose ' + pctChange + '% vs last month (₦' + Math.round(diff).toLocaleString() + ' more). Review categories driving the increase.',
          type: 'warn',
          label: 'SPENDING UP'
        });
      }
      var countDiff = count - prevCount;
      if (countDiff > 3) {
        advice.push({
          text: 'You made ' + countDiff + ' more transactions this month (' + count + ' vs ' + prevCount + '). More frequent spending can add up — try consolidating purchases.',
          type: 'warn',
          label: 'MORE TRANSACTIONS'
        });
      } else if (countDiff < -3) {
        advice.push({
          text: 'You made ' + Math.abs(countDiff) + ' fewer transactions this month (' + count + ' vs ' + prevCount + '). Fewer purchases usually means better control.',
          type: 'success',
          label: 'FEWER TRANSACTIONS'
        });
      }
    } else {
      advice.push({
        text: 'This is your first month tracking with SpendWise. Stick to your budget and check back next month for trends!',
        type: 'success',
        label: 'FIRST MONTH'
      });
    }

    // Category keywords
    var categories = {
      'Food & Drinks': ['food', 'lunch', 'dinner', 'breakfast', 'groceries', 'restaurant', 'eat', 'snack', 'drink', 'water', 'provision', 'rice', 'bread', 'meat', 'chicken', 'beer', 'beverage', 'coffee', 'tea', 'fruit', 'soup', 'swallow', 'shawarma', 'pizza', 'noodle'],
      'Transport': ['transport', 'fuel', 'gas', 'taxi', 'bus', 'uber', 'bolt', 'fare', 'petrol', 'diesel', 'trip', 'keke', 'bike', 'okada', 'train', 'airport', 'flight', 'toll'],
      'Utilities': ['electricity', 'water bill', 'internet', 'phone', 'data', 'bill', 'utility', 'power', 'light', 'prepaid', 'meter', 'cable', 'dstv', 'gotv', 'airtime'],
      'Entertainment': ['movie', 'game', 'music', 'fun', 'party', 'cinema', 'subscribe', 'netflix', 'sport', 'bet', 'gaming', 'concert', 'outing'],
      'Shopping': ['clothes', 'shoes', 'shopping', 'bag', 'accessory', 'fashion', 'wear', 'dress', 'shirt', 'trouser', 'shoe', 'sneaker', 'jewelry', 'watch'],
      'Health': ['hospital', 'doctor', 'medicine', 'pharmacy', 'health', 'drug', 'clinic', 'medical', 'checkup', 'dentist', 'eye', 'surgery', 'insurance'],
      'Housing': ['rent', 'house', 'accommodation', 'maintenance', 'repair', 'furniture', 'appliance', 'paint', 'plumber', 'electrician', 'cleaning'],
      'Education': ['school', 'book', 'course', 'tuition', 'fee', 'class', 'training', 'lesson', 'tutor', 'exam', 'form', 'seminar', 'online course']
    };

    var catTotals = {};
    var catCounts = {};

    monthExp.forEach(function (e) {
      var name = e.name.toLowerCase();
      var categorized = false;
      for (var cat in categories) {
        var keywords = categories[cat];
        for (var k = 0; k < keywords.length; k++) {
          if (name.indexOf(keywords[k]) !== -1) {
            catTotals[cat] = (catTotals[cat] || 0) + e.amount;
            catCounts[cat] = (catCounts[cat] || 0) + 1;
            categorized = true;
            break;
          }
        }
        if (categorized) break;
      }
      if (!categorized) {
        catTotals['Other'] = (catTotals['Other'] || 0) + e.amount;
        catCounts['Other'] = (catCounts['Other'] || 0) + 1;
      }
    });

    var sortedCats = Object.keys(catTotals).sort(function (a, b) {
      return catTotals[b] - catTotals[a];
    });

    // Category breakdown
    if (sortedCats.length > 0) {
      var catLines = sortedCats.map(function (cat) {
        var p = Math.round((catTotals[cat] / total) * 100);
        return '<div class="ai-cat-row"><span class="ai-cat-name">' + cat + '</span><span class="ai-cat-bar"><span class="ai-cat-fill" style="width:' + p + '%"></span></span><span class="ai-cat-amt">' + formatNaira(catTotals[cat]) + '</span></div>';
      });
      advice.push({
        text: '<div class="ai-cat-breakdown">' + catLines.join('') + '</div>',
        type: 'success',
        label: 'SPENDING BREAKDOWN'
      });
    }

    // Budget-based advice
    if (budget > 0) {
      var pct = (total / budget) * 100;

      if (pct > 100) {
        advice.push({
          text: 'You have exceeded your monthly budget by ' + formatNaira(total - budget) + '. Focus on essentials only for the rest of the month.',
          type: 'danger',
          label: 'OVER BUDGET'
        });
      } else if (pct >= 80) {
        advice.push({
          text: 'You have used ' + Math.round(pct) + '% of your budget with ' + (daysInMonth - dayOfMonth) + ' days left. Tighten up on discretionary spending.',
          type: 'warn',
          label: Math.round(pct) + '% USED'
        });
      } else if (pct <= 30) {
        advice.push({
          text: 'Only ' + Math.round(pct) + '% of budget used — excellent discipline. You are on track to save ' + formatNaira(budget - projected) + ' this month.',
          type: 'success',
          label: 'ON TRACK'
        });
      } else {
        advice.push({
          text: 'You have used ' + Math.round(pct) + '% of your budget. At ' + formatNaira(Math.round(dailyRate)) + '/day you are on track to end at ' + Math.round((projected / budget) * 100) + '% usage.',
          type: pct > 60 ? 'warn' : 'success',
          label: Math.round(pct) + '% USED'
        });
      }
    }

    // Daily projection (only if not already covered well)
    if (budget > 0 && pct <= 80) {
      if (projected > budget) {
        advice.push({
          text: 'At ' + formatNaira(Math.round(dailyRate)) + '/day you are projected to exceed budget by ' + formatNaira(projected - budget) + ' by month end. Try cutting back now.',
          type: 'warn',
          label: 'PROJECTION'
        });
      } else if (projected <= budget && pct > 20 && budget > 0) {
        advice.push({
          text: 'At ' + formatNaira(Math.round(dailyRate)) + '/day you are on track to finish the month within budget. Consistent spending — keep it up!',
          type: 'success',
          label: 'PROJECTION'
        });
      }
    }

    // Spending frequency
    var avgPerDay = count / dayOfMonth;
    if (avgPerDay > 3) {
      advice.push({
        text: 'You average ' + avgPerDay.toFixed(1) + ' transactions per day (' + count + ' this month). Many small purchases can drain your wallet — try combining errands.',
        type: 'warn',
        label: 'HIGH FREQUENCY'
      });
    }

    // Large single expense detection
    var sortedAmt = monthExp.slice().sort(function (a, b) { return b.amount - a.amount; });
    if (sortedAmt.length > 2) {
      var largest = sortedAmt[0];
      var second = sortedAmt[1];
      var largestPct = (largest.amount / total) * 100;
      if (largestPct > 40) {
        advice.push({
          text: '"' + largest.name + '" at ' + formatNaira(largest.amount) + ' makes up ' + Math.round(largestPct) + '% of your total. Consider if this was a planned purchase.',
          type: 'warn',
          label: 'LARGE EXPENSE'
        });
      }
      if (largest.amount > 50000) {
        var luxury = ['shoe', 'watch', 'phone', 'laptop', 'tv', 'game', 'shoe', 'bag', 'jewelry', 'fashion'];
        var isLuxury = luxury.some(function (w) { return largest.name.toLowerCase().indexOf(w) !== -1; });
        if (isLuxury) {
          advice.push({
            text: '"' + largest.name + '" is a high-value purchase. Make sure luxury items fit within your broader savings goals.',
            type: 'warn',
            label: 'LUXURY CHECK'
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
          text: 'Savings goal of ' + formatNaira(savingsGoal) + ' reached! You saved ' + formatNaira(savings) + ' this month. Consider raising your goal.',
          type: 'success',
          label: 'SAVINGS GOAL MET'
        });
      } else if (sPct >= 50) {
        advice.push({
          text: 'You are ' + Math.round(sPct) + '% toward your savings goal of ' + formatNaira(savingsGoal) + ' (saved ' + formatNaira(savings) + '). Stay on track!',
          type: 'success',
          label: 'SAVINGS ON TRACK'
        });
      } else if (sPct > 0) {
        advice.push({
          text: 'Saved ' + formatNaira(savings) + ' (' + Math.round(sPct) + '%) of your ' + formatNaira(savingsGoal) + ' goal. Cutting back on ' + sortedCats[0] + ' could help you save more.',
          type: 'warn',
          label: 'SAVINGS TARGET'
        });
      }
    } else if (budget > 0 && total < budget) {
      advice.push({
        text: 'You could save ' + formatNaira(budget - total) + ' this month. Set a savings goal in Settings to track progress!',
        type: 'success',
        label: 'POTENTIAL SAVINGS'
      });
    }

    // Top category specific advice
    if (sortedCats.length > 0) {
      var topCat = sortedCats[0];
      var topAmount = catTotals[topCat];
      var topPct = (topAmount / total) * 100;

      if (topPct > 35) {
        var tip = '';
        if (topCat === 'Food & Drinks') tip = 'Try meal prepping or reducing eating out to cut this down.';
        else if (topCat === 'Transport') tip = 'Consider carpooling, public transport, or walking short distances.';
        else if (topCat === 'Shopping') tip = 'Ask yourself if each purchase is a need vs a want.';
        else if (topCat === 'Entertainment') tip = 'Look for free or cheaper alternatives to paid activities.';
        else if (topCat === 'Utilities') tip = 'Turn off unused devices and negotiate better plans.';
        else tip = 'Review if all items in this category are essential.';
        advice.push({
          text: topCat + ' leads at ' + Math.round(topPct) + '% of spending (' + formatNaira(topAmount) + '). ' + tip,
          type: topPct > 55 ? 'danger' : 'warn',
          label: 'TOP SPEND'
        });
      }

      // Under-spent categories
      var lowestCat = sortedCats[sortedCats.length - 1];
      var lowestPct = (catTotals[lowestCat] / total) * 100;
      if (lowestPct < 5 && sortedCats.length > 2 && lowestCat !== 'Other') {
        advice.push({
          text: lowestCat + ' accounts for only ' + Math.round(lowestPct) + '% of spending. Good control if discretionary.',
          type: 'success',
          label: 'LOW SPEND'
        });
      }
    }

    // Average expense and balance check
    var avg = total / count;
    if (avg > 15000) {
      advice.push({
        text: 'Average expense is ' + formatNaira(avg) + ' (' + count + ' items). Large averages may indicate big one-off purchases — review if each was necessary.',
        type: 'warn',
        label: 'HIGH AVERAGE'
      });
    } else {
      advice.push({
        text: 'Average expense is ' + formatNaira(avg) + ' across ' + count + ' item(s) — your transaction sizes look reasonable.',
        type: 'success',
        label: 'AVERAGE'
      });
    }

    // Weekend vs weekday
    var weekendTotal = 0;
    var weekdayTotal = 0;
    monthExp.forEach(function (e) {
      var d = new Date(e.createdAt);
      var day = d.getDay();
      if (day === 0 || day === 6) weekendTotal += e.amount;
      else weekdayTotal += e.amount;
    });
    var weekendPct = (weekendTotal / total) * 100;
    if (weekendPct > 50) {
      advice.push({
        text: Math.round(weekendPct) + '% of your spending happens on weekends. Be mindful of weekend outings and impulse buys.',
        type: 'warn',
        label: 'WEEKEND SPENDING'
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

    // Month picker
    monthPicker.addEventListener('change', function () {
      selectedMonth = monthPicker.value;
      renderExpenses();
    });

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

    selectedMonth = getCurrentMonthKey();
    monthPicker.value = selectedMonth;

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
