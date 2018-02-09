cp service_scripts/* /etc/systemd/system/
npm install
cd ui; npm install; cd ..
systemctl start lpwanserver-rest
systemctl start lpwanserver-ui
systemctl enable lpwanserver-rest
systemctl enable lpwanserver-ui
