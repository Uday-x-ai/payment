const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your Telegram bot token
const token = '7541405374:AAFI-r25zSFrpc-TnYLQxUuuv4xLuFN6gZY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Variable to store the user's state
let userStates = {};

// Handle '/start' command with optional parameters
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const param = match[1].trim(); // Extract the parameter from the /start command

    if (param.startsWith('status')) {
        const uniqueId = param.replace('status', '').trim();

        if (uniqueId) {
            const url = `https://api-hub.pw/status.php?id=${uniqueId}`;

            try {
                const response = await axios.get(url);
                const data = response.data; // Assuming the API returns JSON

                // Send the status data to the user
                bot.sendMessage(chatId, `<b>STATUS:</b> ${data.status}\n<b>AMOUNT:</b> ₹${data.amount}\n<b>ORDER ID:</b> <code>${data.order_id}</code>`, {
                    parse_mode: 'html'
                });
            } catch (error) {
                bot.sendMessage(chatId, `Error retrieving status: ${error.message}`);
            }
        } else {
            bot.sendMessage(chatId, 'Invalid status ID.');
        }
    } else {
        bot.sendMessage(chatId, '<b>Welcome! Send /create_order to create a new order.</b>',{
                           parse_mode: 'html'
                       });
    }
});


// Handle '/create_order' command
bot.onText(/\/create_order/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'enter_amount' };
    bot.sendMessage(chatId, '<b>Enter Amount You Want To Pay</b>', { parse_mode: 'html' });
});

// Handle messages to get the amount and create the order
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (userStates[chatId] && userStates[chatId].step === 'enter_amount') {
        const amount = msg.text.trim();

        // Validate amount
        if (isNaN(amount) || Number(amount) <= 0) {
            bot.sendMessage(chatId, 'Please enter a valid amount.');
            return;
        }

        // Proceed to create the order
        const url = `https://api-hub.pw/create.php?amount=${amount}`;

        try {
            const response = await axios.get(url);
            const data = response.data; // Assuming the API returns JSON
            const urll = `https://api-hub.pw/payment.php?id=${data.unique_id}`;
            const oid = data.order_id;
            bot.sendMessage(chatId, `<b>Order Created Successfully!\nOrder Id:</b> <code>${oid}</code>\n<a href='https://t.me/UdayScripts_paymentbot?start=status${data.unique_id}'>Check Status</a>`, {
                parse_mode: 'html',
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Pay Now',
                        web_app: { url: urll }
                    }]]
                }
            });

        } catch (error) {
            bot.sendMessage(chatId, `Error creating order: ${error.message}`);
        }

        // Reset the user's state
        delete userStates[chatId];
    } else if (msg.text.toLowerCase() !== '/start' && msg.text.toLowerCase() !== '/create_order') {
        if (!msg.text.startsWith('/start')) {
            bot.sendMessage(chatId, 'Please Contact @uday_x For Any Help');
        }
    }
});
