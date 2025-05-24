const mockSendMail = jest.fn();

const mockTransporter = {
    sendMail: mockSendMail
};

const mockCreateTransport = jest.fn().mockReturnValue(mockTransporter);

jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport
}));

module.exports = {
    mockSendMail,
    mockTransporter,
    mockCreateTransport
}; 