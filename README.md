![Brand Central Station](https://github.com/evan-bradley/brandcentralstation/blob/master/client/src/assets/brand_central_full.png)

[Live Website](http://brandcentral.xyz/)

## Build and Run

### Setup MySQL Database and Tables
In the 'server' directory:
```
npm run init-db
```

To remove the databases:
```
npm run uninit-db
```

### Install dependencies
In 'server':
```
npm install
```

In 'client':
```
npm install
```

### Create environment file
Create a text file named '.env' in the 'server' directory with contents:
```
DB_USER=root
DB_PASS=''
DB_NAME=BRAND_CENTRAL
TEST_DB_NAME=BRAND_CENTRAL_TESTING
SESSION_DB=SESSION_STORE
URL='localhost:8080'
```

### Run Tests
In 'server':
```
npm test
```

### Generate and View API Documentation
In 'server':
```
npm run doc 
```
Then navigate to 'localhost:8080' in your web browser.

### Serve with hot reload at localhost:8080
From 'server' directory (for API):
```
npm start
```

From 'client' directory (for web server):
```
npm run dev
```

### Serve production files at localhost:80
In 'client':
```
npm run build
```

In 'server':
```
sudo PORT=80 node src/server.js
```
# dropbox
