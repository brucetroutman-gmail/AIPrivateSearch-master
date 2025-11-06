#!/usr/bin/env python3
"""
Sample Python Document

This Python file tests code processing capabilities in AIPrivateSearch.
"""

import os
import sys
from datetime import datetime

class SampleClass:
    """A sample class for testing purposes."""
    
    def __init__(self, name):
        self.name = name
        self.created_at = datetime.now()
    
    def greet(self):
        """Return a greeting message."""
        return f"Hello from {self.name}!"
    
    def get_info(self):
        """Return information about this instance."""
        return {
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'type': 'SampleClass'
        }

def main():
    """Main function for testing."""
    sample = SampleClass("AIPrivateSearch Test")
    print(sample.greet())
    print(f"Info: {sample.get_info()}")

if __name__ == "__main__":
    main()