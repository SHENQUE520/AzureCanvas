package org.angellock.impl.spring;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AppRouter {
    @GetMapping("/")
    public String loadHome(){
        return "home";
    }
    @GetMapping("/home")
    public String loadHomeAlt(){
        return "home";
    }
}
