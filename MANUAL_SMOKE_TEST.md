# Manual Smoke Test Guide for Privod Platform UI

## Prerequisites
- Application running at http://localhost:13000
- Chrome/Firefox browser with DevTools

## Setup Authentication

1. Open http://localhost:13000
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Paste and execute:

```javascript
localStorage.setItem('privod-auth', JSON.stringify({
  state: {
    user: {
      id: 'u-admin-1',
      email: 'admin@privod.ru',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      roles: ['ADMIN']
    },
    token: 'demo-token',
    refreshToken: 'demo-refresh',
    isAuthenticated: true
  }
}));
location.reload();
```

## Test Checklist

### 1. /projects - Projects List
- [ ] Page loads without errors
- [ ] Click "Создать" / "Create" button
- [ ] Modal/form opens
- [ ] Close modal (Cancel/X)
- [ ] Click on any project row
- [ ] Project detail page loads
- [ ] Navigate to "Documents" tab
- [ ] Documents list displays
- **Console Errors:** _____________

### 2. /settings/permissions - Permissions Settings
- [ ] Page loads without errors
- [ ] Permission list displays
- [ ] Click "Add" / "Create" button (if exists)
- [ ] Click "Edit" on any permission
- [ ] Form/modal opens
- [ ] Close without saving
- **Console Errors:** _____________

### 3. /settings/users - Users Settings
- [ ] Page loads without errors
- [ ] Users list displays
- [ ] Click "Create User" / "Add User" button
- [ ] User form opens
- [ ] Close form
- [ ] Click "Edit" on existing user
- [ ] Edit form opens
- **Console Errors:** _____________

### 4. /cost-management/commitments - Commitments
- [ ] Page loads without errors
- [ ] Commitments list displays
- [ ] Click "Create" / "Add Commitment" button
- [ ] Form opens
- [ ] Close form
- [ ] Click on any commitment row
- [ ] Detail view opens
- **Console Errors:** _____________

### 5. /invoices - Invoices
- [ ] Page loads without errors
- [ ] Invoices list displays
- [ ] Click "Create Invoice" button
- [ ] Invoice form opens
- [ ] Close form
- [ ] Click "Edit" on any invoice
- [ ] Edit form opens
- [ ] Click status change button (if exists)
- **Console Errors:** _____________

### 6. /payments - Payments
- [ ] Page loads without errors
- [ ] Payments list displays
- [ ] Click "Create Payment" button
- [ ] Payment form opens
- [ ] Close form
- [ ] Click on any payment row
- [ ] Detail view opens
- **Console Errors:** _____________

### 7. /change-management/events - Change Events
- [ ] Page loads without errors
- [ ] Events list displays
- [ ] Click "Create Event" button
- [ ] Event form opens
- [ ] Close form
- [ ] Click on any event row
- [ ] Event detail page loads
- **Console Errors:** _____________

### 8. /change-management/orders - Change Orders
- [ ] Page loads without errors
- [ ] Change orders list displays
- [ ] Click "Create Order" button
- [ ] Order form opens
- [ ] Close form
- [ ] Click on any order row
- [ ] Order detail page loads
- **Console Errors:** _____________

### 9. /rfi - RFI (Request for Information)
- [ ] Page loads without errors
- [ ] RFI list displays
- [ ] Click "Create RFI" button
- [ ] RFI form opens
- [ ] Close form
- [ ] Click on any RFI row
- [ ] RFI detail page loads
- **Console Errors:** _____________

## How to Check Console Errors

1. Keep DevTools open during testing
2. Watch the Console tab for:
   - Red error messages
   - Uncaught exceptions
   - Failed network requests (404, 500)
   - React warnings (yellow)
3. Note any errors with:
   - Error message
   - File/line number
   - Stack trace

## Common Issues to Look For

- ❌ Buttons that don't respond to clicks
- ❌ Forms that don't open
- ❌ Navigation that leads to 404
- ❌ Console errors after button clicks
- ❌ Uncaught promise rejections
- ❌ React render errors
- ❌ Network request failures

## Report Format

### FAILURES
1. **Page:** /invoices
   - **Button:** "Create Invoice"
   - **Issue:** Button click causes console error
   - **Error:** `TypeError: Cannot read property 'id' of undefined at InvoiceForm.tsx:45`
   - **Severity:** MEDIUM

### PASSES
1. **Page:** /projects
   - ✅ Page loads
   - ✅ Create button opens modal
   - ✅ Navigation to detail works
   - ✅ No console errors

## Automated Test Results

### HTTP Status Check (Completed)
✅ All 9 pages return HTTP 200 - Basic routing works!

- ✅ /projects - HTTP 200
- ✅ /settings/permissions - HTTP 200
- ✅ /settings/users - HTTP 200
- ✅ /cost-management/commitments - HTTP 200
- ✅ /invoices - HTTP 200
- ✅ /payments - HTTP 200
- ✅ /change-management/events - HTTP 200
- ✅ /change-management/orders - HTTP 200
- ✅ /rfi - HTTP 200

**Note:** HTTP 200 only confirms the route exists and returns content. It does NOT test:
- Button functionality
- Console errors
- Runtime JavaScript errors
- User interactions
- Modal/form behaviors

These require manual browser testing or proper E2E automation setup.
