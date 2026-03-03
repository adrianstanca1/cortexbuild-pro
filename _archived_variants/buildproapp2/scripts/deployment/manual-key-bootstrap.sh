#!/bin/bash
echo "========================================================"
echo "🔐 Manual SSH Key Bootstrap"
echo "========================================================"
echo "I need your help to install the SSH key because the server"
echo "is rejecting my automated password attempts."
echo ""
echo "👉 When prompted for password, enter: Cumparavinde1."
echo ""
echo "Then, copy and paste these lines into the sftp> prompt:"
echo "--------------------------------------------------------"
echo "mkdir .ssh"
echo "put authorized_keys .ssh/authorized_keys"
echo "chmod 600 .ssh/authorized_keys"
echo "bye"
echo "--------------------------------------------------------"
echo ""
echo "Press Enter to start SFTP..."
read

sftp -P 65002 u875310796@82.29.191.97
