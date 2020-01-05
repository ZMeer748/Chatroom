var loginPage = document.querySelector('#loginPage');
var chatPage = document.querySelector('#chatPage');
var loginForm = document.querySelector('#loginForm');
var chatForm = document.querySelector('#chatForm');
var messageInput = document.querySelector('#messageInput');
var messageArea = document.querySelector('#messageArea');
var messageContainer = document.querySelector('#messageContainer');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#3398da', '#2fcb71', '#5cade2', '#cb4335',
    '#f1c40f', '#af7ac4', '#eb984e', '#48c9b0'
];

function connect(event) {
    username = document.querySelector('#usernameInput').value.trim();

    if (username) {
        loginPage.classList.add('d-none');
        chatPage.classList.remove('d-none');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
    messageContainer.scrollTop = messageContainer.scrollHeight;
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser", {},
        JSON.stringify({
            sender: username,
            type: 'JOIN'
        })
    )
}


function onError(error) {
    var messageElement = document.createElement('li');
    messageElement.classList.add('message-event-li');
    messageElement.classList.add('pb-3');
    messageElement.classList.add('text-center');

    var textElement = document.createElement('p');
    textElement.style.color = 'red';
    var messageText = document.createTextNode('无法连接至 WebSocket 服务器，请刷新重试');
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    messageContent = document.querySelector('#messageInput').value.trim();
    if (messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    var textElement;
    var messageText;

    if (message.type === 'JOIN') {
        messageElement.classList.add('message-event-li');
        messageElement.classList.add('pb-3');
        messageElement.classList.add('text-black-50');
        messageElement.classList.add('text-center');
        message.content = '用户 ' + message.sender + ' 加入了群聊';

        textElement = document.createElement('p');
        messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);

        messageElement.appendChild(textElement);

    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('message-event-li');
        messageElement.classList.add('pb-3');
        messageElement.classList.add('text-black-50');
        messageElement.classList.add('text-center');
        message.content = '用户 ' + message.sender + ' 离开了群聊';

        textElement = document.createElement('p');
        messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);

        messageElement.appendChild(textElement);

    } else {
        if (message.sender == username)
            messageElement.classList.add('message-sent-li');
        else
            messageElement.classList.add('message-replies-li');

        messageElement.classList.add('pb-3');
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('shadow-sm');
        messageContentDiv.classList.add('rounded');

        messageElement.appendChild(messageContentDiv);

        var messageUserName = document.createElement('h6')
        var messageUserNameStrong = document.createElement('strong');
        messageUserName.appendChild(messageUserNameStrong);

        messageContentDiv.appendChild(messageUserName);

        var usernameText = document.createTextNode(message.sender);
        messageUserNameStrong.appendChild(usernameText);

        textElement = document.createElement('p');
        messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);

        messageContentDiv.appendChild(textElement);

    }

    messageArea.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    console.info("scrollTop: " + messageContainer.scrollTop);
    console.info("scrollHeight: " + messageContainer.scrollHeight);
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

loginForm.addEventListener('submit', connect, true)
chatForm.addEventListener('submit', sendMessage, true)