# Guestbook

### Project setup

To start the project, I first created the mono-repo. Creating a directory containing two additional directories, client and server. Inside the client first ran `touch index.html style.css app.js` to obtain the basics needed for a client side webpage. Inside the server I ran `touch server.js`. Inside both the client and server I ran `npm init -y` initialising the project and `npm i` to install the basic packages. From here I need specific packages needed for each environment, on the client side I ran `npm i vite` installing the backbone for the client. From here I added the scripts inside the `package.json` file I would execute through `npm run`. These were `"build": "npm i && vite build"` and `"dev": "vite"`. The dev script would allow me to test the environment in real time, while the build script would install the relevant packages based on the `package.json` file and run the production copy when deployed using the generated dist directory containing my client project code in a much more simplified way. This is done to optimise execution in the production environment. Collapsing the client directory I turned my attention towards the server. Here I ran `npm i express`, `npm i cors` and `npm i pg`. This obtained the express package, the backbone of the server environment. Cors the cross origin resource sharing package, acting as a middleman software between the connection and express. Lastly pg, which stands for PostgreSQL, allowing us to connect to our external database. I then modified the server `package.json` with the script `"dev": "node --watch server"` to run the server.js file with node using --watch to actively monitor and changes while developing and reflecting those changes on the server actively.

### Database

Unlike previous projects, I decided to handle the javascript logic first. Since this project would be using a mono-repo, relying on 3 connecting elements to work together (database, server and client), I needed to work down the process tree, ensuring everything behind the scenes was functional first. Starting this process off I went over to https://supabase.com/ and created a table with the following:

```sql
CREATE TABLE guestbook (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT,
  message TEXT,
  likes INT
);
```

To ensure the likes collumn is always defaulting to zero, I also ran:

```sql
ALTER TABLE guestbook ALTER COLUMN likes SET DEFAULT 0;
```

Based on my requirements I knew I needed a username, a message to fill my page later down the line. I also included likes at this early stage to handle later down the line. I then grabbed my database url and password, modified the url to include both together and pasted this in my server.js and assigned it a variable to use later. Next I went back to the terminal inside my server and ran `touch seed.js`. In here I imported pg and added a variable with `new pg.Pool()` placing the db url inside here. I then created 2 arrays, one for messages and one for usernames and filled them with some sample data. At this stage I also created a likes variable and set it to zero to fill the table. I then created a function which would run `TRUNCATE guestbook RESTART IDENTITY` and `INSERT INTO guestbook (username, message, likes) VALUES ($1, $2, $3)` inputting my two arrays and variable into the placeholder fields of $1, $2 and $3. This function would allow me to empty and refill the database anytime during testing, resetting the identity key back to zero at the same time.

### Server

From here, the next part of the chain was the server. I start by importing express, cors and pg. I create the basic template for an express server assigning express to the app and getting the root route, responding with a basic message. I then listen to port 8080. From here I start the server with `npm run dev` so I can use Thunder Client to check if my server is opperating correctly by using get at the endpoint of localhost:8080. Next I add my database to the server using the same method as the seed.js. I then create a get endpoint for my /guestbook, making a query to the database with `SELECT * FROM guestbook` and responding with the data. Next checking this endpoint works with Thunder Client by making a get request at localhost:8080/guestbook. To finish up with the server, I also create a post endpoint which would use identical logic to get, however this time query the database with `INSERT INTO guestbook (username, message, likes) VALUES ($1, $2, $3)`. I also test this endpoint with Thunder Client.

### Client

With the endpoints ready I create basic HTML on the client using emmet !. I fill the body with a form tag and place two input tags and a button tag inside, I assign these elements names and placholders. I then put a div tag and assign it an id, this is where I will place my database data. Moving to the app.js I first get the div element by id as a global variable. I then create an async function to handle submit logic. First preventing default behaviour so the submit action doesn't add a query to the url and grabbing the form element by id. I then make a fetch request to the post endpoint which responds with the data placed inside the username and message text boxes. From here I create another function to handle the get requests. This allows me to fetch the updated database once data was input. I create a fetch request to the get endpoint and append the given data to my container element.

### Server Likes and Delete

I turned my attention to like and delete buttons. To begin this process, I created two more button elemenets under the get handler function on the client and assigned them ids to represent delete and like. From here I returned to the server to create the endpoints. I started with the delete endpoint. Using the database identity id I was able to single out which entry I was wanting to delete, and was able to remove this table entry by querying `DELETE FROM guestbook WHERE id = $1`. With the endpoint at `/guestbook/:id` I will be able to pass the parameter id as a variable and fill this value into the placeholder $1 using a PUT request. At this stage I added a try catch to each endpoint to only respond to the client with a success message with a successful database query.

As for the likes, I needed a way of incrementing the like count upon click, but also decrementing the count depending on the PUT request recieved. For context, at this planning stage, I wanted the like count to increase once per client, so that if the element is clicked again, the like is removed. This logic will be handled later in the client, so I just needed to handle when the data does come, what to do with it here. To differentiate between likes and unlike I added decided passing a flag would be best. Using a PUT endpoint, at /guestbook/:id/like, I'm once again passing the id parameter but also the whether the request is a like or an unlike. I created an object and assigned it the request.body. I can then query this object for a like and subsiquently query the database with the relevant logic. For a like the database query would be `UPDATE guestbook SET likes = likes + 1 WHERE id = $1`. This updates the guestbook likes by taking the current value of likes and making it equal to the current likes plus one at the passed parameter id. I added `RETURNING *` to the end to return everything.

### Client Likes and Delete

On the client side, I created an event listener for a button with the class delete-button, which is assigned to each created button within the forEach loop found within the getHandler. I then take the id of the clicked element to know which row it corresponds to. I then pass this id as a parameter in my fetch request using the delete method, logging the response and calling the getHandler to update the page.

For the like button, I once again check if the class matches and then grab the id of the element, removing any unnecessary string information. I then needed a way of tracking whether the button had been clicked previously. To do this I decided local storage was likely the best method. First I would track a variable in local storage called likedEntries and see if it contains the id of the clicked element. From here I need to differentiate between like and dislike. If the id exists in local storage its an unlike, but if not I need to add it and consider this action a like. Since I'm grabbing this information from the server using request.body, I need to pass the action inside the body as a string during my request so it becomes avaliable to the server. Making a fetch request to the PUT endpoint, I ensure the method is PUT and the standard header is present, attaching the like/unlike to the body. From here I need to update the local storage based on the action, if this was a like, I need to add this id to likedEntries, if not I need to find where it's stored and remove it. Lastly I need to update the page, initially deciding to update the element here, but I also wanted to refresh the database afterwards regadless. If I did want to minimise database queries, I could decide not to call getHandler here.

### Websocket

To ensure the page dynamically updated for all connected clients whenever anything was added, removed or liked on the page I found something called a websocket. This is actively checking for any changes, informing all clients it has occured. Prior to this I was thinking of using a function that called getHandler after a given amount of time, be decided this would make many needless queries to the database and therefore wasn't really an option. To start I opened terminal and ran `npm i express-ws` which installed the websocket package which ties into express. In the server.js I imported this package and initialised the websocket with `expressWs(app)`. I then created a variable to track connected users and added logic to add them to the connected clients array when connected. Following this, logic to remove them from this array on disconnect. I then created a function which would send updates to each connected client when called. When calling this function, I passed the data into the request as an object so that any functions on the client side had access to this data if needed and then differentiated each request with a name reflecting what the request carried.

On the client side, I created a message event listener for the websocket. I then created a switch to differentiate the requests. This was only done for logging and testing purposes since I call the same function regardless, but if I was to build upon this logic later, the foundations are already layed out.

### Environment Variables

To avoid pushing my database url to github, environemt variables were needed. Locally I can create a .env file and assign the variables a value here. These aren't declared in the javascript but can be used anytime with `process.env.VARIABLE_NAME` on the server, and `import.meta.env.VITE_VARIABLE_NAME` on the client. It's worth noting, if the information is sensitive removing `VITE_` from your variable name is needed. For example anything containing a password doesn't need this prefix. For my needs I added an environment variable on the server for my database url and on the client I added 3 for my production server url. Before pushing to github I just needed to ensure that my .env was listed in my .gitignore to prevent pushing any sensitive information. Once this is done, when deploying on render.com I added the environemnt variables to their respective environments.

### Styling

To finish the project, I needed to make it look presentable, so finally I would add the CSS. This required some restructuring of my HTML elements and possibly adding classes to elements to allow for CSS integration. Up till this point, I hadn't decided on a theme, but after some thought I decided to have my page Shrek themed, with movie quotes. As a result, I ended up styling this with green and adding some popular quotes to my template. I moved the text boxes to the bottom of the page and encapsulated each individual database entry in its own box. I used positon relative on the elements that house buttons and then used position absolute to fix them where I needed. For the like button, I placed this just below the quote. For the delete button I placed this in the upper right. I then had the border radius of the buttom right cut in sligtly to create a unique shape.

When handling mobile screen sizes. Initially I thought of using @media, however it appears when I styled the page the first time, it just scaled to a mobile aspect ration anyway, I only needed to modify the inputs to sit in a column instead of a row. To ensure scrolling past the inputs elements was possible on mobile, I also added padding to the bottom of main. This allows you to scroll just a hair past the fixed inputs element.

### ARIA

To finish up, I added some accesibility settings. I used a media query in the CSS to make the experience smoother for motion sick users (not that there was too much that could with this page). I then added aria-labels to the buttons and text boxes with an aria live to the container.

### Problems and Solutions

Once deployed to render.com, the browser console was displaying the error message: `Mixed Content: The page was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint. This request has been blocked; this endpoint must be available over WSS.` This confused me at first but after some googling I realised that servers running on `HTTPS://` need to use `WSS://` and not `WS://`. I quickly changed this and the error went away.

After fixing this I got a new error: `net::ERR_SSL_PROTOCOL_ERROR`, indicating a problem with establishing a secure connection to the server. After quickly Googling I found that the server might have a valid SSL/TLS certificate configured for the default port (80 or 443 for HTTPS) but not for port 8080. After sending a GET request using Thunder Client, I could see a response here, however the deployed website was reporting an error. I then amended my Thunder Client get request to include the port :8080 and an error occured here too. Removing the port on the client side for each request resolved this issue. It's worth noting that to test locally the port is still needed, so I added this to my local environment variable in my client .env file as a suffix to my exisiting hostname.

## Overview

The requirements completed for this project:

- The HTML form submits data as expected (not into the url as a query)
- The CSS is styled for multiple screen sizes using using @media.
- I am using a functioning GET endpoint
- I am using a functioning POST endpoint
- I created a seed.js file to create some sample data.

The additional features added to the project include:

- Created a delete button to remove entries
- Created a like button to show appreciation to entries
- Allowed likes to be taken away if already liked, or liked on accident per client
- Used a websocket to reflect recent database changes on all connected clients
- Added ARIA live and labels to various elements

The most challenging part of this project was learning SQL syntax. Specifically PostgreSQL, which I learned half way through the project was completely different to DBCC. The syntax looks simple at first but this simplicity did confuse me. Keywords I imagined did one thing didn't do what I initially thought. Since the whole project revolved around manipulating the database to contain the data needed at any given time, a vast majority of this project was spent trying to find the the correct SQL to do what I needed. Thanks to all the previous weeks work, I've got a relatively good understanding of how html, css and javascript operates, however SQL is something I've never touched before.
