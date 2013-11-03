To copy:

Server:

EVENT		DATA
cp:copy		whatever you want in the clipboard
cp:paste	request for the data in the clipboard


On cp:paste server sends a cp:text with the current clipboard. Can be empty string. The clipboard is not deleted on paste.