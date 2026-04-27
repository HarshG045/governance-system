# Project Info — Quick Reference

## Default Login Credentials

### Admin
| Name | Email | Password |
|------|-------|----------|
| System Admin | admin@gov.local | admin123 |

### Officers
| Name | Email | Password | Department |
|------|-------|----------|------------|
| Vikram Singh | vikram@gov.local | officer123 | Water Supply |
| Neha Gupta | neha@gov.local | officer123 | Roads and Transport |
| Amit Kumar | amit@gov.local | officer123 | Sanitation |

### Citizens
| Name | Email | Password |
|------|-------|----------|
| Test Citizen | citizen@test.com | test1234 |
| Rahul Sharma | rahul@citizen.com | pass1234 |
| Priya Patel | priya@citizen.com | pass1234 |

## Departments
- Water Supply
- Roads and Transport
- Sanitation
- Electricity

## Sample Complaints
| Title | Submitted By | Department | Status |
|-------|-------------|------------|--------|
| Road pothole on Main Street | Rahul Sharma | Water Supply | In Progress |
| Street lights not working in Sector 7 | Rahul Sharma | Roads and Transport | Submitted |
| Garbage not collected in Green Park | Priya Patel | Sanitation | Submitted |

## How to Run
```bash
npm run dev
```
Open: http://localhost:5000

## MySQL Config (.env)
```
PORT=5000
JWT_SECRET=dev_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql@123
DB_NAME=grievance_db
```
