# NineMC (Nine Member Club) Admin Frontend

A modern admin interface built with Next.js 15 and React 19 for user management and file uploads.

## Features

- **User Management**: Complete CRUD operations for user accounts
- **File Uploads**: Secure file upload with S3 integration
- **Authentication**: Login, register, password reset, email verification
- **Role-Based Access**: Different permissions for different user roles
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Next.js 15** with React 19
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Axios** for API calls
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Getting Started

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Environment setup**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

3. **Start development server**
   ```bash
   yarn dev
   ```
   The application will be available at http://localhost:3000

## Available Scripts

- `yarn dev` - Start development server (port 3000)
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.js            # Root layout + admin shell
│   ├── page.jsx             # Dashboard landing
│   ├── login/               # Admin login page
│   ├── users/               # MLM users management
│   ├── membership/          # Membership plans and upgrades
│   ├── rewards/             # MLM rewards
│   ├── withdrawals/         # MLM withdrawals
│   ├── mk-users/            # Junket MK users
│   ├── jk-rewards/          # Junket rewards
│   ├── jk-withdrawals/      # Junket withdrawals
│   ├── inquiries/           # User inquiries
│   ├── administrators/      # Admin accounts
│   ├── settings/            # System settings
│   └── api/                 # Route handlers
├── components/              # UI components/modals/tables
│   ├── Logo.jsx
│   ├── LanguageSwitcher.jsx
│   ├── UserEditModal.jsx
│   ├── UserViewModal.jsx
│   ├── UsersTable.jsx
│   ├── MkUserEditModal.jsx
│   ├── MembershipDetailModal.jsx
│   ├── WithdrawalTable.jsx
│   ├── WithdrawalCompleteModal.jsx
│   ├── InquiriesTable.jsx
│   ├── InquiryModal.jsx
│   ├── InquiryDetailPage.jsx
│   ├── AdministratorEditModal.jsx
│   ├── SettingModal.jsx
│   ├── ChangePasswordModal.jsx
│   └── ConfirmModal.jsx
├── contexts/                # React contexts
│   ├── AdminAuthContext.js
│   └── LanguageContext.js
├── hooks/
│   └── useTranslation.js
├── lib/                     # Utilities and API wrappers
│   ├── adminApi.js
│   ├── csvUtils.js
│   ├── dateUtils.js
│   ├── decimalUtils.js
│   └── utils.js
└── constants.js             # Route and label constants
```

## License

This project is licensed under the MIT License.