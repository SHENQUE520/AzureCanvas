package org.neonangellock.azurecanvas.rounters;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AppRouter {
    @GetMapping("/app")
    public String loadHome(){
        return "home";
    }
    @GetMapping("/azurecanvas")
    public String loadHomeAlt(){
        return "home";
    }
}
