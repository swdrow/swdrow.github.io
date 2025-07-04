#!/usr/bin/env python3
"""
Simple HTTP server with API proxy to avoid CORS issues
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os
from urllib.error import URLError

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Check if this is an API request
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            # Serve static files normally
            super().do_GET()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        if self.path.startswith('/api/'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        else:
            super().do_OPTIONS()
    
    def handle_api_request(self):
        try:
            # Proxy the request to Flask server
            flask_url = f'http://localhost:5000{self.path}'
            print(f"Proxying request: {self.path} -> {flask_url}")
            
            with urllib.request.urlopen(flask_url) as response:
                data = response.read()
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
                
        except URLError as e:
            print(f"Error proxying request: {e}")
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = json.dumps({
                "error": "API server unavailable",
                "details": str(e)
            }).encode()
            self.wfile.write(error_response)
        except Exception as e:
            print(f"Unexpected error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = json.dumps({
                "error": "Internal server error",
                "details": str(e)
            }).encode()
            self.wfile.write(error_response)

if __name__ == "__main__":
    PORT = 8001
    
    # Change to the directory containing the website files
    web_dir = "/home/swd/swdrow.github.io"
    os.chdir(web_dir)
    
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        print(f"Serving website with API proxy at http://localhost:{PORT}")
        print(f"Web files from: {web_dir}")
        print(f"API requests proxied to: http://localhost:5000")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()
