# SFTP Client wrapper

import paramiko
import io
from typing import List, Dict, Any


class SFTPClient:
    """SFTP client wrapper for connecting to SFTP server"""
    
    def __init__(self, host: str, port: int, username: str, password: str):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.transport = None
        self.sftp = None
    
    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
    
    def connect(self):
        """Establish SFTP connection"""
        self.transport = paramiko.Transport((self.host, self.port))
        self.transport.connect(username=self.username, password=self.password)
        self.sftp = paramiko.SFTPClient.from_transport(self.transport)
    
    def close(self):
        """Close SFTP connection"""
        if self.sftp:
            self.sftp.close()
        if self.transport:
            self.transport.close()
    
    def list_files(self, remote_dir: str) -> List[Dict[str, Any]]:
        """List files in a remote directory"""
        files = []
        try:
            for attr in self.sftp.listdir_attr(remote_dir):
                files.append({
                    'filename': attr.filename,
                    'size': attr.st_size,
                    'mtime': attr.st_mtime
                })
        except Exception as e:
            raise Exception(f"Failed to list directory {remote_dir}: {str(e)}")
        return files
    
    def download_file(self, remote_path: str) -> io.BytesIO:
        """Download a file and return as BytesIO object"""
        try:
            file_obj = io.BytesIO()
            self.sftp.getfo(remote_path, file_obj)
            file_obj.seek(0)
            return file_obj
        except Exception as e:
            raise Exception(f"Failed to download file {remote_path}: {str(e)}")
    
    def upload_file(self, local_path: str, remote_path: str):
        """Upload a file to SFTP"""
        try:
            self.sftp.put(local_path, remote_path)
        except Exception as e:
            raise Exception(f"Failed to upload file to {remote_path}: {str(e)}")
