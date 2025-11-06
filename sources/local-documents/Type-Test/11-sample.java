/**
 * Sample Java Document
 * 
 * This Java file tests code processing capabilities in AIPrivateSearch.
 */

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

public class SampleClass {
    private String name;
    private LocalDateTime createdAt;
    
    public SampleClass(String name) {
        this.name = name;
        this.createdAt = LocalDateTime.now();
    }
    
    public String greet() {
        return "Hello from " + this.name + "!";
    }
    
    public Map<String, Object> getInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", this.name);
        info.put("createdAt", this.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        info.put("type", "SampleClass");
        return info;
    }
    
    public static void main(String[] args) {
        SampleClass sample = new SampleClass("AIPrivateSearch Test");
        System.out.println(sample.greet());
        System.out.println("Info: " + sample.getInfo());
    }
}