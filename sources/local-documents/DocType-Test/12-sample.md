# 12-sample
DocID: Typ_1762462676173_v7apsnrzq

```cpp
/**
 * Sample C++ Document
 * 
 * This C++ file tests code processing capabilities in AIPrivateSearch.
 */

#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include <sstream>

class SampleClass {
private:
    std::string name;
    std::chrono::system_clock::time_point createdAt;

public:
    SampleClass(const std::string& name) : name(name) {
        createdAt = std::chrono::system_clock::now();
    }
    
    std::string greet() const {
        return "Hello from " + name + "!";
    }
    
    void printInfo() const {
        auto time_t = std::chrono::system_clock::to_time_t(createdAt);
        std::cout << "Name: " << name << std::endl;
        std::cout << "Created: " << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S") << std::endl;
        std::cout << "Type: SampleClass" << std::endl;
    }
};

int main() {
    SampleClass sample("AIPrivateSearch Test");
    std::cout << sample.greet() << std::endl;
    sample.printInfo();
    return 0;
}
```