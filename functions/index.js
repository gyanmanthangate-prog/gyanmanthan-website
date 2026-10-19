const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { setGlobalOptions } = require("firebase-functions");
const nodemailer = require("nodemailer");

// Cost control and global options
setGlobalOptions({ maxInstances: 10 });

initializeApp();

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gate@gyanmanthanclasses.com',
        pass: 'geuu ofqa nkgs oazm' // Aapka 16-digit Google App Password
    }
});

const ADMIN_EMAIL = 'gate@gyanmanthanclasses.com';

// 1. New Request Notification (Admin ko email) - [Fixed double slash and path]
exports.onNewUserRequest = onDocumentCreated("students/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const newUser = snapshot.data();

    const mailOptions = {
        from: 'gate@gyanmanthanclasses.com',
        to: ADMIN_EMAIL,
        subject: 'New Test Access Request Received',
        text: `Ek naye user ne test access ke liye request bheji hai!\n\nUser Name: ${newUser.name || 'N/A'}\nUser Email: ${newUser.email || 'N/A'}\n\nKripya Firebase Console par check karke enable karein.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent for new user:', newUser.email);
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
});

// 2. Status Change Notification (User ko enable/disable email + Admin CC) - [Fixed path to 'students']
exports.onUserStatusChange = onDocumentUpdated("students/{userId}", async (event) => {
    const change = event.data;
    if (!change) return;

    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Check agar 'isEnabled' status change hua hai
    if (newValue.isEnabled !== previousValue.isEnabled) {
        const userEmail = newValue.email;
        if (!userEmail) return;

        let subject = '';
        let text = '';

        if (newValue.isEnabled) {
            subject = 'Account Enabled - Test Login Access';
            text = 'Badhai ho! Aapka account enable kar diya gaya hai. Ab aap test link par click karke login kar sakte hain.';
        } else {
            subject = 'Account Disabled';
            text = 'Aapka account filhal disable kar diya gaya hai. Kripya admin se sampark karein.';
        }

        const mailOptions = {
            from: 'gate@gyanmanthanclasses.com',
            to: userEmail,
            cc: ADMIN_EMAIL,
            subject: subject,
            text: text
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Status update email sent to:', userEmail);
        } catch (error) {
            console.error('Error sending status email:', error);
        }
    }
});